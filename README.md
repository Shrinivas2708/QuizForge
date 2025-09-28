# QuizForge 🧠✨

QuizForge is an intelligent, AI-driven platform that transforms any syllabus into a comprehensive and interactive quiz. Designed for students, educators, and lifelong learners, QuizForge makes studying more efficient, engaging, and fair.

## ⭐ Key Features

* **📄 Syllabus to Quiz in Seconds**: Upload your syllabus in PDF or DOC format, and let our AI generate a variety of questions based on the key topics.
* **📚 Multiple Quiz Formats**: Engage with the material in different ways with Multiple Choice, True/False, and Short Answer questions.
* **🤖 AI-Powered Chat**: Have a conversation with your syllabus! Ask questions and get instant, context-aware answers from our integrated AI chat.
* **⚙️ Fully Customizable**: Tailor your quizzes by choosing the topics, difficulty level, number of questions, and time limits to fit your study needs.
* **🔒 Anti-Cheat System**: Ensure a fair and focused learning environment with features like fullscreen mode, tab-switching warnings, and screenshot prevention.
* **📊 Detailed Analytics**: Receive immediate feedback with a score breakdown, correct/incorrect answers, and AI-generated explanations to help you learn from your mistakes.

## 🛠️ Tech Stack

QuizForge is built with a modern and robust technology stack:

* **Frontend**: **React** with **Vite** for a fast and responsive user experience, with routing managed by **TanStack Router**.
* **Backend**: **Hono** on **Cloudflare Workers** for a fast and scalable serverless API.
* **Artificial Intelligence**: **OpenAI** for cutting-edge question generation and chat capabilities.
* **Database**: **PostgreSQL** with **Drizzle ORM** for reliable and type-safe data storage, connected via `@neondatabase/serverless`.
* **Authentication**: **better-auth** for handling user authentication with support for both email/password and social providers like Google.

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

    Create a `.env` file in the `server` directory. You can use the `server/.env.example` as a template.

    ```env
    DATABASE_URL="your_postgresql_connection_string"
    OPENAI_API_KEY="your_openai_api_key"
    BETTER_AUTH_SECRET="your_better_auth_secret"
    BETTER_AUTH_URL="http://localhost:8787"
    GOOGLE_CLIENT_ID="your_google_client_id"
    GOOGLE_CLIENT_SECRET="your_google_client_secret"
    FRONTEND_URL="http://localhost:5173"
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
    The server will be available at `http://localhost:8787`.

## 🤝 How to Contribute

We welcome contributions to make QuizForge even better!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 🚀 Deployment

This project is configured for continuous integration and deployment using **GitHub Actions**. The CI/CD pipeline is defined in `.github/workflows/ci.yml` and automates the following processes:

* **Build and Test**: On every push to the `main` branch, the pipeline builds and tests both the client and server applications.
* **Client Deployment**: Upon a successful build, the frontend is deployed to **Vercel**.
* **Server Deployment**: The backend server is deployed to **Cloudflare Workers** using Wrangler.