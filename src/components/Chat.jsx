import '../styles/chat.css';

//nothing connected yet 
export default function Chat() {
    return (
        <section className="chat-bar">
            <h2>Chat</h2>
            <div className="chat-messages"></div>
            <form className="chat-compose">
                <input type="text" placeholder="Type a message..." />
                <button type="button">Send</button>
            </form>
        </section>
    );
}
