import { useState } from 'react';

const placeholderImage1 = require('./Placeholder.png');
const placeholderImage2 = require('./Placeholder2.png');

const statuses = {
    waiting: "waiting",
    ready: "ready"
}

const turns = {
    this: "this",
    other: "other"
}

function CollabBody() {
    const [status, setStatus] = useState(statuses.waiting);

    return (
        <div className="container-fluid">
            { (status === statuses.ready) ?
                <div>
                    <div className="row my-3">
                        <div className="col">
                            <InterlocutorVideoBox initialStatus={statuses.ready} placeholderImage={placeholderImage1} />
                        </div>
                        <div className="col me-4">
                            <ActivityBody />
                        </div>
                    </div>
                    <div className="row my-5">
                        <div className="col mx-4 d-flex justify-content-center">
                            <Table />
                        </div>
                    </div>
                </div> :
                <div>
                    <div className="row my-3 mx-3 d-flex justify-content-between">
                        <InterlocutorVideoBox initialStatus={statuses.waiting} placeholderImage={placeholderImage1} />
                        <InterlocutorVideoBox initialStatus={statuses.ready} placeholderImage={placeholderImage2} />
                    </div>
                    <div className="row mt-5">
                        <StartCollabButton setStatus={setStatus} />
                    </div>
                </div>
            }
        </div>
    );
}

function InterlocutorVideoBox({ initialStatus, placeholderImage}) { 
    const [imageStatus, setImageStatus] = useState(initialStatus);

    if (initialStatus === statuses.waiting) {
        setTimeout(() => {
            setImageStatus(statuses.ready);
        }, "10000");
    }
    
    return (
        <div className="card d-flex justify-content-center align-items-center" id="interlocutorVideoBox">
            { (imageStatus === statuses.ready) ? <TemporaryImagePlaceholder placeholderImage={placeholderImage} /> :                
                <LoadingPlaceholder />
            }
        </div>
    );
}

function TemporaryImagePlaceholder({ placeholderImage}) {
    return (
        <img src={placeholderImage} className="img-fluid py-2" alt="Placeholder for testing" />        
    );
}

function LoadingPlaceholder() {
    return (
        <div className="spinner-border" role="status" />
    );
}

function StartCollabButton({ setStatus }) {
    function startCollab() {
        setStatus(statuses.ready);
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="StartCollabButton" onClick={startCollab}>Ready!</button>
    );
}

function ActivityBody() {
    const [turn, setTurn] = useState(turns.other);

    let bodyContent;
    switch (turn) {
        case turns.this:
        bodyContent = <ThisTurnActivity />;
        break;
        case turns.other:
        bodyContent = <OtherTurnActivity setTurn={setTurn} />;
        break;
        default:
        bodyContent = <p>Something has gone wrong, please try again.</p>;
    }

    return (
        <div>
            {bodyContent}
        </div>
    );
}

function ThisTurnActivity() {
    return (
        <div>
            <ThisTurnTaskText />
        </div>
    );
}

function ThisTurnTaskText() {
    return (
        <div className="card my-5"> 
            <div className="card-header">
                Traduzca:
            </div>
            <div className="card-body">
                <p className="my-1">Jugaron felices en el parque hasta que empezó a llover.</p>
            </div>
        </div>
    );
}

function OtherTurnActivity({ setTurn }) {
    return (
        <div className="d-flex flex-column justify-content-center">
            <OtherTurnTaskText />
            <TheyGotItButton setTurn={setTurn} />
        </div>
    );
}

function OtherTurnTaskText() {
    return (
        <div>
            <div className="card my-5"> 
                <div className="card-header">
                    Help them translate:
                </div>
                <div className="card-body">
                    <p className="my-1">She walked quickly to catch the bus before it left the stop.</p>
                </div>
            </div>
            <div className="card mb-5">
                <div className="card-header">
                    Into:
                </div>
                <div className="card-body">
                    <p className="my-1">Ella caminó rápido para alcanzar el autobús antes de que saliera de la parada.</p>
                </div>
            </div>
        </div>
    );
}

function TheyGotItButton({ setTurn }) {
    function finish() {
        setTurn(turns.this);
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="theyGotItButton" onClick={finish}>They got it!</button>
    );
}

function Table() {
    return (
        <div className="panel mt-1" id="scores-table">
            <table className="table table-borderless">
                <TableHead />
                <TableBodyItem />
            </table>
        </div>
    );
}

function TableHead() {
    return (
        <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">Team</th>
                <th scope="col">Score</th>
            </tr>
        </thead>
    );
}

function TableBodyItem() {
    return (
        <tbody>
            <tr className="rowItem">
                <th scope="row">384</th>
                <td>Johnny + Javier</td>
                <td>36</td>
                <td></td>                
            </tr>
            <tr className="rowItem">
                <th scope="row">385</th>
                <td>You</td>
                <td>29</td>
                <td></td>
            </tr>
            <tr className="rowItem">
                <th scope="row">386</th>
                <td>Mackenzie + Lewis</td>
                <td>28</td>
                <td></td>
            </tr>        
        </tbody>
    );
}

export default CollabBody;