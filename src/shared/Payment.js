import { useEffect } from "react";

export default function ProductDisplay() {
    useEffect(() => {
        const form = document.getElementById('checkout-form');
        const handleSubmit = (event) => {
            const username = localStorage.getItem("username");
            if (username) {
                document.getElementById('username').value = username;
            }
        };

        form.addEventListener('submit', handleSubmit);

        return () => {
            form.removeEventListener('submit', handleSubmit);
        };
    }, []);

    return (
        <section className="d-flex flex-column justify-content-center align-items-center">
            <h3>UniLex Semester Access</h3>
            <p>Your course requires that you purchase access to the UniLex platform.</p>
            <form id="checkout-form" action="/create-checkout-session" method="POST">
                <input type="hidden" name="username" id="username" />
                <button type="submit" className="button">Checkout</button>
            </form>
        </section>
    );
}
