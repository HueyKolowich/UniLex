require('dotenv').config({ path: __dirname + '/.env' });

const isDev = process.env.NODE_ENV === 'development';

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');
const morgan = require('morgan');
const helmet = require('helmet');
const stripe = require('stripe')(process.env.STRIPE_API_SECRET_KEY);

const classroomsModel = require('./models/classrooms.js');
const eventsModel = require('./models/events.js');
const meetingsConfigModel = require('./models/meetingsConfig.js');
const paymentsModel = require('./models/payments.js');
const promptsModel = require('./models/prompts.js');
const studentRatingsModel = require('./models/studentRatings.js');
const submissionsModel = require('./models/submissions.js');
const userModel = require('./models/user.js');

const { webSocketHandler } = require('./WebSocketHandler.js');
const { sanitzeJSONResponseObjects } = require('./lib/SanitizeResponses.js');
const { ContactService } = require('./services/contact-service.js');

const app = express();
const port = process.env.PORT;

const openai = new OpenAI();

const contactService = new ContactService();

const authCookieName = 'authToken';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../build')));

app.use(morgan('combined'));

app.use(helmet());

app.get('/about', (req, res) => {
    const filePath = 'build/about.html';

    res.sendFile(filePath, { root: path.join(__dirname, '..') });
});

app.get('/payment-return', (req, res) => {
    const filePath = 'build/payment-return.html';

    res.sendFile(filePath, {
        root: path.join(__dirname, '..'),
    });
});

app.get('/check-auth', (req, res) => {
    const token = req.cookies[authCookieName];
    if (token) {
        res.status(200).send({ msg: 'authToken valid' });
    } else {
        res.status(401).send({ msg: 'authToken not valid' });
    }
});

app.post('/register', async (req, res) => {
    try {
        const existingUser = await userModel.getUser(req.body.username);
        if (existingUser) {
            return res.status(409).send({ msg: 'Username already in use' });
        }

        const user = await userModel.createUser(
            req.body.username,
            req.body.password,
            req.body.role,
            req.body.classRoomId,
            req.body.email,
            req.body.firstname,
            req.body.lastname,
            req.body.phone,
            req.body.target,
            req.body.native,
            req.body.location
        );

        await classroomsModel.addUserToClassroom(
            req.body.classRoomId,
            req.body.username,
            req.body.role
        );
        const paymentRequired =
            await classroomsModel.checkPaymentRequirementForClassroom(
                req.body.classRoomId
            );

        res.status(201).send({
            msg: 'Success',
            id: user._id,
            paymentRequired: paymentRequired,
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send({ msg: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const user = await userModel.getUser(req.body.username);
    if (user) {
        if (await bcrypt.compare(req.body.password, user.password)) {
            const paymentStatus = await paymentsModel.getPaymentStatus(
                req.body.username
            );

            if (paymentStatus !== 'paid') {
                return res.status(403).send({ msg: 'Payment required' });
            }

            const newToken = await userModel.generateNewSessionAuthToken(
                req.body.username
            );

            res.cookie(authCookieName, newToken, {
                httpOnly: true,
                maxAge: 9000000,
                secure: !isDev,
                sameSite: 'Strict',
            });

            if (user.role === 'teacher' && Array.isArray(user.classRoomId)) {
                user.classRoomId = user.classRoomId[0];
            }

            res.status(200).send({
                msg: 'Success',
                role: user.role,
                username: user.username,
                classRoomId: user.classRoomId,
            });
            return;
        }
    }
    res.status(401).send({ msg: 'Unauthorized' });
});

app.post('/password-reset-request', async (req, res) => {
    const user = await userModel.getUserByEmail(req.body.email);

    if (user === null) {
        res.status(404).send({ msg: 'No user by this email in database' });
    } else {
        const resetToken = await userModel.generatePasswordResetToken(
            user.username
        );

        const resetLink = `${
            isDev ? 'http://localhost:3000' : 'https://unilexlanguage.com'
        }/?resetToken=${resetToken}&email=${user.email}`;

        contactService.sendEmail(
            user.email,
            'Password reset instructions',
            `Please click the following link to reset your password.
      
      ${resetLink}
      `
        );

        res.status(200).send({ msg: 'Success' });
    }
});

app.post('/password-reset', async (req, res) => {
    const user = await userModel.getUserByEmail(req.body.email);

    if (user === null) {
        res.status(404).send({ msg: 'No user by this email in database' });
    } else {
        if (
            user.resetToken !== req.body.resetToken ||
            user.resetTokenExpiration < new Date()
        ) {
            res.status(401).send({ msg: 'Unauthorized' });
        } else {
            await userModel.updatePassword(user.username, req.body.password);
            res.status(200).send({ msg: 'Success' });
        }
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie(authCookieName);
    res.end();
});

app.get('/getClassInfo', async (req, res) => {
    const classRoomId = req.query.classRoomId;

    try {
        let classInfo;
        if (classRoomId) {
            classInfo = await classroomsModel.getClassInfo(classRoomId);

            res.status(200).json({
                native: classInfo.native,
                target: classInfo.target,
                teacher: classInfo.teacher,
            });
        } else {
            res.status(400).json({
                error: 'An error occurred while getting the classroom info for this classroom, there was no specified classroom code in request',
            });
        }
    } catch (error) {
        console.error('Error in getting the clasroom info:', error);
        res.status(500).json({
            error: 'An error occurred while getting the clasroom info',
        });
    }
});

app.post(
    '/create-checkout-session',
    express.urlencoded({ extended: true }),
    async (req, res) => {
        try {
            const username = req.body.username;

            if (username) {
                const session = await stripe.checkout.sessions.create({
                    line_items: [
                        {
                            price: process.env.STRIPE_PRICE_ID,
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${process.env.RETURN_URL}?success=true`,
                    cancel_url: `${process.env.RETURN_URL}?canceled=true`,
                    automatic_tax: { enabled: true },
                });

                if (paymentsModel.setCheckoutSession(username, session.id)) {
                    res.redirect(303, session.url);
                } else {
                    res.status(500).json({
                        error: 'The server was not able to being your payment process. Please contact us using the information found on our about page or try again',
                    });
                }
            } else {
                res.status(400).json({
                    msg: 'No username associated with this payment request',
                });
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            res.status(500).json({
                error: 'The server was not able to handle your payment correctly. Please contact us using the information found on our about page or try again',
            });
        }
    }
);

app.post('/payment-status', async (req, res) => {
    try {
        const { username, noPaymentRequired } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        if (noPaymentRequired) {
            await paymentsModel.setPaymentStatus(username, 'paid');
        } else {
            const checkoutSession = await paymentsModel.getCheckoutSession(
                username
            );

            if (!checkoutSession) {
                return res
                    .status(404)
                    .json({ error: 'Checkout session not found' });
            }

            const session = await stripe.checkout.sessions.retrieve(
                checkoutSession
            );

            if (!session) {
                return res
                    .status(500)
                    .json({ error: 'Failed to retrieve session from Stripe' });
            }

            await paymentsModel.setPaymentStatus(
                username,
                session.payment_status
            );
        }

        res.status(200).json({
            message: 'Payment status updated successfully',
        });
    } catch (error) {
        console.error('Error processing payment status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use(async (req, res, next) => {
    try {
        const token = req.cookies[authCookieName];
        if (!token) {
            return res
                .status(401)
                .json({ msg: 'Unauthorized: No token provided' });
        }

        const user = await userModel.getUserByToken(token);
        if (!user) {
            return res.status(401).json({ msg: 'Unauthorized: Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
});

app.get('/role', async (req, res) => {
    res.status(200).json({ role: req.user.role });
});

app.get('/generate-video-token', (req, res) => {
    const options = {
        expiresIn: '120m',
        algorithm: 'HS256',
    };

    const payload = {
        apikey: process.env.VIDEOSDK_API_KEY,
        permissions: ['allow_join'],
    };

    const videoToken = jwt.sign(
        payload,
        process.env.VIDEOSDK_SECRET_KEY,
        options
    );

    res.json({ videoToken });
});

app.get('/current-meeting-scheduled', async (req, res) => {
    try {
        const events = await eventsModel.getBookedEvents(req.user.username);
        const now = new Date();

        let currentEvent = null;
        let nextEvent = null;
        let otherParticipantUsername = '';

        for (const event of events) {
            const start = new Date(event.start);
            const end = new Date(event.end);

            if (
                (start <= now && now <= end) ||
                (start - now <= 300000 && now < start)
            ) {
                currentEvent = event;
                otherParticipantUsername = event.participants.filter(
                    (username) => username !== req.user.username
                )[0];
            }

            if (
                start > now &&
                end > now &&
                (!nextEvent || start < new Date(nextEvent.start))
            ) {
                nextEvent = event;
            }

            if (currentEvent) break;
        }

        res.status(200).json({
            result: !!currentEvent,
            soughtUsername: otherParticipantUsername,
            nextEvent: nextEvent
                ? {
                      title: nextEvent.title,
                      start: nextEvent.start,
                      end: nextEvent.end,
                      participants: nextEvent.participants,
                  }
                : null,
        });
    } catch (error) {
        console.error(
            'Error checking if there is a current meeting scheduled:',
            error
        );
        res.status(500).json({
            error: 'An error occurred while checking if there is a current meeting scheduled',
        });
    }
});

app.get('/class-assignment', async (req, res) => {
    const { classRoomId } = req.query;

    if (!classRoomId) {
        return res.status(400).json({ error: 'classRoomId is required' });
    }

    try {
        const prompts = await promptsModel.getAllPrompts(classRoomId);

        if (!prompts || prompts.length === 0) {
            res.status(200).json({
                prompts: [
                    {
                        prompt: 'No prompts have been assigned to this class',
                        time: 0,
                    },
                ],
            });
        } else {
            res.status(200).json({ prompts });
        }
    } catch (error) {
        console.error('Error getting all prompts for class', error);
        res.status(500).json({
            error: 'An error occurred getting prompts for the specified class',
        });
    }
});

app.get('/prompts', async (req, res) => {
    try {
        const { promptLevel, filter } = req.query;

        const formattedPrompt =
            'Generate a ' +
            req.user.target +
            ' discussion prompt based off the ' +
            promptLevel +
            ' ACTFL level. ' +
            (filter
                ? 'The topic of the discussion prompt should be: ' +
                  filter +
                  '. '
                : '') +
            'Return just the prompt as a JSON object, the key should be called prompt.';

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: formattedPrompt }],
            model: 'gpt-4o-mini',
        });

        let prompt = completion.choices[0].message.content;
        prompt = sanitzeJSONResponseObjects(prompt);

        res.status(200).json({ prompt });
    } catch (error) {
        console.error('Error generating prompt:', error);
        res.status(500).json({
            error: 'An error occurred while generating a prompt',
        });
    }
});

app.post('/prompts', async (req, res) => {
    try {
        const classRoomId = await userModel.getClassRoomIdByToken(
            req.cookies[authCookieName]
        );
        if (!classRoomId) {
            return res
                .status(400)
                .json({ error: 'Invalid or missing authentication token' });
        }

        const { promptsList } = req.body;
        if (!Array.isArray(promptsList)) {
            return res
                .status(400)
                .json({ error: 'Invalid promptsList format' });
        }

        const classRoomIds = Array.isArray(classRoomId)
            ? classRoomId
            : [classRoomId];

        await Promise.all(
            classRoomIds.map(async (id) => {
                await promptsModel.addPrompts(id, promptsList);
            })
        );

        res.status(200).json({ message: 'Prompts added successfully' });
    } catch (error) {
        console.error('Error adding prompts:', error);
        res.status(500).json({
            error: 'An error occurred while adding prompts',
        });
    }
});

app.get('/events', async (req, res) => {
    try {
        const events = await eventsModel.getEvents(
            req.user.username,
            req.user.target,
            req.user.native
        );
        res.status(200).json({ events: events });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({
            error: 'An error occurred while getting events',
        });
    }
});

app.delete('/events', async (req, res) => {
    const { calEventId } = req.body;

    try {
        await eventsModel.deleteEvent(calEventId);

        const events = await eventsModel.getEvents(
            req.user.username,
            req.user.target,
            req.user.native
        );
        res.status(200).json({ events: events });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            error: 'An error occurred while deleting event',
        });
    }
});

app.post('/events', async (req, res) => {
    const { start, end } = req.body;

    try {
        await eventsModel.addEvent(
            req.user.username,
            req.user.firstname,
            req.user.location,
            start,
            end,
            req.user.native,
            req.user.target
        );
        res.status(201).json({
            message: 'Event added successfully',
            title: req.user.firstname,
            details: req.user.location,
        });
    } catch (error) {
        res.status(500).json({
            error: 'An error occurred while adding the event',
        });
    }
});

app.post('/events-status', async (req, res) => {
    const { calEventId } = req.body;

    const formatGMTDate = (GMTDateString) => {
        if (!GMTDateString || GMTDateString === 'NA') {
            return { date: '', time: '' };
        }

        const date = new Date(GMTDateString);

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');

        return {
            date: `${month}/${day}/${year}`,
            time: `${formattedHours}:${minutes} ${ampm}`,
        };
    };

    const capitalizeFirstLetter = (string) =>
        string.charAt(0).toUpperCase() + string.slice(1);

    try {
        const event = await eventsModel.changeEventStatus(
            calEventId,
            req.user.username,
            req.user.firstname
        );
        const otherParticipant = await userModel.getUser(event.username);

        if (!isDev) {
            const subject = 'Someone has scheduled a conversation with you!';
            const body = `
        Hi ${otherParticipant.firstname},

        ${
            req.user.firstname
        } has scheduled one of your conversations with you through UniLex! 

        When: ${formatGMTDate(event.start).date}

        You will spend half of the time helping ${
            req.user.firstname
        } with their ${capitalizeFirstLetter(req.user.target)},
        and the other half of the conversation will be ${
            req.user.firstname
        } helping you with your ${capitalizeFirstLetter(
                otherParticipant.target
            )}!

        Please make sure to prepare for the conversation and reach out if you need any assistance.

        Best regards,
        The UniLex Team
      `;

            contactService.sendEmail(otherParticipant.email, subject, body);
        }

        const events = await eventsModel.getEvents(
            req.user.username,
            req.user.target,
            req.user.native
        );
        res.status(200).json({ events: events });
    } catch (error) {
        console.error('Error changing status of event:', error);
        res.status(500).json({
            error: 'An error occurred while changing the status of an event',
        });
    }
});

app.delete('/events-status', async (req, res) => {
    const { calEventId, otherParticipantUsername } = req.body;

    try {
        const otherParticipant = await userModel.getUser(
            otherParticipantUsername
        );

        await eventsModel.removeNameFromEventParticipantList(
            calEventId,
            otherParticipant.firstname
        );

        const events = await eventsModel.getEvents(
            req.user.username,
            req.user.target,
            req.user.native
        );
        res.status(200).json({ events: events });
    } catch (error) {
        console.error('Error changing status of event:', error);
        res.status(500).json({
            error: 'An error occurred while changing the status of an event',
        });
    }
});

app.get('/meetingcount', async (req, res) => {
    try {
        const result = await meetingsConfigModel.getDesiredMeetingsCountForUser(
            req.user.username
        );

        res.status(200).json({ count: result });
    } catch (error) {
        console.error('Error getting desired meetings count for user:', error);
        res.status(500).json({
            error: 'An error occurred while getting desired meetings count for user',
        });
    }
});

app.post('/meetingcount', async (req, res) => {
    const { meetingsCount } = req.body;

    try {
        await meetingsConfigModel.setDesiredMeetingsCountForUser(
            req.user.username,
            meetingsCount
        );

        res.status(200).json({ msg: 'Success' });
    } catch (error) {
        console.error('Error setting desired meetings count for user:', error);
        res.status(500).json({
            error: 'An error occurred while setting desired meetings count for user',
        });
    }
});

app.get('/submissions', async (req, res) => {
    const username = req.query.username;

    try {
        let submissions = [];
        if (username) {
            submissions = await submissionsModel.getStudentSubmissions(
                username
            );

            res.status(200).json({ submissions: submissions });
        } else {
            res.status(400).json({
                error: 'An error occurred while getting the submissions for the user, no specified username in request',
            });
        }
    } catch (error) {
        console.error('Error in getting the submissions for user:', error);
        res.status(500).json({
            error: 'An error occurred while getting the submissions for the user',
        });
    }
});

app.post('/submissions', async (req, res) => {
    const {
        difficultiesSubmission,
        improvementSubmission,
        cultureSubmission,
        otherStudentRating,
        otherStudentUsername,
        comfortableRating,
    } = req.body;

    try {
        await submissionsModel.setStudentSubmission(
            req.user.username,
            req.user.classRoomId,
            new Date(),
            difficultiesSubmission,
            improvementSubmission,
            cultureSubmission,
            comfortableRating
        );

        await studentRatingsModel.setRatingForOtherStudent(
            otherStudentUsername,
            otherStudentRating
        );

        res.status(200).json({ msg: 'Success' });
    } catch (error) {
        console.error('Error uploading student submission:', error);
        res.status(500).json({
            error: 'An error occurred while uploading the student submission',
        });
    }
});

app.get('/student-list', async (req, res) => {
    const classRoomId = req.query.classRoomId;

    try {
        if (classRoomId) {
            const studentUsernameList =
                await classroomsModel.getStudentUsernamesByClassRoomId(
                    classRoomId
                );

            const studentListPromises = studentUsernameList.map(
                async (username) => {
                    const student = await userModel.getUser(username);
                    if (student) {
                        return {
                            username: student.username,
                            firstname: student.firstname,
                            lastname: student.lastname,
                        };
                    }
                    return null;
                }
            );

            let studentList = await Promise.all(studentListPromises);
            studentList = studentList.filter((student) => student !== null);

            res.status(200).json({ studentList: studentList });
        } else {
            throw new Error('No classRoomId found in request');
        }
    } catch (error) {
        console.error('Error in getting student list: ', error);
        res.status(500).json({
            error: 'An error occurred while getting the list of students for this classroom',
        });
    }
});

app.get('/student-table-info', async (req, res) => {
    const username = req.query.username;

    try {
        let rating, recent, score;
        if (username) {
            ({ rating, recent } =
                await submissionsModel.getLatestMeetingDateAndRating(username));
            score = await studentRatingsModel.getAverageHelpfulnessScore(
                username
            );

            res.status(200).json({
                rating: rating,
                recent: recent,
                score: score,
            });
        } else {
            res.status(400).json({
                error: 'An error occurred while getting the comfortRating for the user, no specified username in request',
            });
        }
    } catch (error) {
        console.error('Error in getting the comfortRating for user:', error);
        res.status(500).json({
            error: 'An error occurred while getting the comfortRating for the user',
        });
    }
});

app.get('/classroom-name', async (req, res) => {
    const classRoomId = req.query.classRoomId;
    const allClasses = req.query.allClasses;

    try {
        if (classRoomId) {
            const classInfo = await classroomsModel.getClassInfo(classRoomId);

            res.status(200).json({ name: classInfo.name });
        } else if (allClasses) {
            let names = await userModel.getClassRoomIdByToken(
                req.cookies[authCookieName]
            );
            if (!Array.isArray(names)) {
                names = [names];
            }

            const classes = await classroomsModel.getClasses(names);

            res.status(200).json({ classes: classes });
        } else {
            res.status(400).json({
                error: 'No specified classRoomId in request',
                name: 'No name found for classroom',
            });
        }
    } catch (error) {
        console.error('Error in getting the name for classroom:', error);
        res.status(500).json({
            error: 'An error occurred while getting the name for the classroom',
            name: 'No name found for classroom',
        });
    }
});

const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

webSocketHandler(server);
