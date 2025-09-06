# QuizForge 🧠✨

QuizForge is an intelligent, AI-driven platform that transforms any syllabus into a comprehensive and interactive quiz. Designed for students, educators, and lifelong learners, QuizForge makes studying more efficient, engaging, and fair.



## ⭐ Key Features

* [cite_start]**📄 Syllabus to Quiz in Seconds**: Upload your syllabus in PDF or DOC format, and let our AI generate a variety of questions based on the key topics. [cite: 3]
* [cite_start]**📚 Multiple Quiz Formats**: Engage with the material in different ways with Multiple Choice, True/False, and Short Answer questions. [cite: 21, 22, 23]
* **🤖 AI-Powered Chat**: Have a conversation with your syllabus! [cite_start]Ask questions and get instant, context-aware answers from our integrated AI chat. [cite: 25]
* [cite_start]**⚙️ Fully Customizable**: Tailor your quizzes by choosing the topics, difficulty level, number of questions, and time limits to fit your study needs. [cite: 26, 27, 28, 29]
* [cite_start]**🔒 Anti-Cheat System**: Ensure a fair and focused learning environment with features like fullscreen mode, tab-switching warnings, and screenshot prevention. [cite: 31, 32]
* [cite_start]**📊 Detailed Analytics**: Receive immediate feedback with a score breakdown, correct/incorrect answers, and AI-generated explanations to help you learn from your mistakes. [cite: 38, 39]

## 🛠️ Tech Stack

QuizForge is built with a modern and robust technology stack:

* **Frontend**: **React** with **Tailwind CSS** for a beautiful and responsive user experience.
* **Backend**: **Node.js** and **Express** for a fast and scalable server.
* **Artificial Intelligence**: **OpenAI** for cutting-edge question generation and chat capabilities.
* **Database**: **PostgreSQL** for reliable and persistent data storage.

## 🚀 Getting Started

Follow these instructions to get a local copy of QuizForge up and running.

### Prerequisites

* Node.js (v18 or higher)
* pnpm package manager

### Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/shrinivas2708/quizforge.git](https://github.com/shrinivas2708/quizforge.git)
    cd quizforge
    ```

2.  **Install Dependencies**
    ```bash
    pnpm install
    ```

3.  **Environment Variables**

    Create a `.env` file in the `server` directory and add the following:

    ```env
    DATABASE_URL="your_postgresql_connection_string"
    OPENAI_API_KEY="your_openai_api_key"
    ```

### Running the Application

This is a monorepo with separate client and server packages.

* **To start the React client:**
    ```bash
    pnpm --filter client dev
    ```
    The client will be available at `http://localhost:5173`.

* **To start the Node.js server:**
    ```bash
    pnpm --filter server dev
    ```
    The server will be available at `http://localhost:3000`.

## 🤝 How to Contribute

We welcome contributions to make QuizForge even better!


1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

