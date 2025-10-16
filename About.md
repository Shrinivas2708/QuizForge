# QuizForge: AI-Powered Learning & Assessment

Welcome to QuizForge, an intelligent, AI-driven platform that transforms your study materials into interactive quizzes, complete with a chat-based study companion, proctoring, and detailed analytics.

QuizForge is designed to move beyond simple memorization. It's a comprehensive learning environment where you can upload your content, engage in AI-driven conversations to understand it, generate custom quizzes to test your knowledge, and even create secure, shareable "Rooms" for group assessments.

This document details what the platform does, how it benefits you, and what is happening behind the scenes at each step.

## How It Works: The User Journey

Your experience with QuizForge is a seamless flow from content to comprehension.

### 1. Start with Your Content

Your journey begins on the "New Chat" page. After logging in (via Email/Password or Google), you are greeted and prompted to attach a document.

* **What you do:** You upload a PDF document (e.g., a syllabus, textbook chapter, or research paper).
* **What happens:** Uploading a file kicks off two processes simultaneously:
    1.  **A new Chat Session is created,** and you are navigated to a dedicated chat interface.
    2.  **The AI Ingestion Pipeline begins** in the background. Your document is processed, its text is extracted, and it's analyzed to create intelligent "embeddings" (a vector representation of its meaning).

### 2. The AI Chat & Study Companion

While the AI pipeline processes your document, your chat session is already active. You will see a "Processing your document..." message, detailing the steps.

* **What you can do:** You can immediately start asking questions about your document.
* **What happens:** When you send a message, our server uses an AI-powered "intent classifier" to understand your goal.
    * If you ask a **"content_question"** (e.g., "Summarize chapter 3"), the system performs Retrieval-Augmented Generation (RAG). It finds the most relevant passages from your document (using the vector embeddings), combines them with your question and chat history, and asks the AI to provide a precise, context-aware answer.

### 3. Generating Your Quiz

Once the document is fully processed (its status becomes "ready"), a new message appears in your chat: the **Quiz Configuration** panel.

* **What you do:** You configure your desired quiz:
    * Set Difficulty (Easy, Medium, Hard)
    * Choose the Number of Questions (5 to 30)
* **What happens:** You hit "Generate Quiz." The server sends the *entire raw text* of your document along with your configurations to the AI. The AI reads the content and generates a set of questions (Multiple Choice, True/False), including incorrect options, the correct answer, and **detailed feedback** for each question. This structured quiz is then saved to your account, and a "Quiz Ready!" message appears in your chat.

### 4. Taking a Quiz (The Solo Experience)

From the "Quiz Ready!" message, you can click "Start Quiz," which navigates you to the dedicated quiz-taking screen.

* **What you do:** You are prompted to start the quiz, which will request to enter **fullscreen mode**. You then answer each question.
* **What happens (Proctoring):** To ensure a focused study environment, our proctoring system is activated. The platform actively monitors for:
    * **Fullscreen Exit:** Leaving fullscreen mode.
    * **Tab/Window Switching:** Clicking away from the quiz tab (`visibilitychange` or `blur` events).
    * **Copy/Paste & Right-Click:** Attempting to copy content or use the context menu.
    Each violation is logged as a "proctoring event". If you exceed the event limit, your quiz is automatically submitted, marked as **disqualified**, and your score is set to 0.

### 5. Reviewing Your Results

After submitting (or being disqualified), you are redirected to the results page.

* **What you see:** You get your final score. More importantly, you see a complete breakdown of every question, showing:
    * Your submitted answer (marked correct or incorrect).
    * The correct answer.
    * The AI-generated **feedback and explanation** for *why* the answer is correct.
* You can review all past attempts from the "Past Attempts" page.

### 6. Creating & Sharing Rooms (Multiplayer)

This is where QuizForge shines for educators and groups.

* **What you do:** From the chat interface, you click "Create Room". A dialog appears, letting you configure the room:
    * **Room Name:** A public name for your quiz session.
    * **Time Limit:** How long participants have to complete the quiz.
    * **Proctoring Level:** You can set it to `none`, `basic`, or `strict`.
    * **Participant Fields:** Choose what information to collect (e.g., "Name", "Email").
* **What happens:** The server creates a "Room" linked to your quiz, with a unique 8-character `shareableCode`. You are given a shareable link to send to your participants.

### 7. Joining a Room (The Participant Experience)

Participants do **not** need a QuizForge account.

* **What they do:** They open the shareable link. They are presented with a simple join screen asking for the fields you required (e.g., Name, Email).
* **What happens:** After submitting their details, they are registered as a "participant" in the room. They are then taken to the exact same proctored quiz-taking experience, enforcing fullscreen and all anti-cheat rules you set.

### 8. Monitoring Room Analytics (The Owner's View)

As the room owner, you have a powerful analytics dashboard.

* **What you do:** You navigate to the "Rooms" tab from your profile and click "Analytics" on any room you've created.
* **What you see:** A comprehensive dashboard with:
    1.  **Overview:** High-level stats like Average Score, Total Participants, Average Completion Time, and the number of Disqualified submissions.
    2.  **Score Distribution:** A bar chart showing how many participants scored in each range.
    3.  **Participants List:** A detailed table of every participant, their score, and their status.
    4.  **Question Analysis:** A breakdown of *each question*, showing its success rate.
    5.  **Individual Analysis:** You can click "Analysis" on any participant to see their full submission, including their specific answers and a log of all their **proctoring events** (e.g., "Tab Switch at 10:32 AM").

## Core Platform Deep Dive

This is what makes QuizForge "intelligent."

* **AI Ingestion Pipeline:** When you upload a PDF, we extract its text. This text is then split into manageable chunks. Each chunk is converted into a vector embedding and stored in a vector database, mapped to your user ID.
* **AI Chat (RAG):** When you ask a question, we first find the most relevant text chunks from the vector database. We then feed these chunks (the "context"), your chat history, and your new question into an AI model. This allows the AI to answer *specifically* based on your document, not just its general knowledge.
* **AI Quiz Generation:** This process provides the AI with the *entire raw text* of your document and a precise schema for the output. It instructs the AI to read the document and generate questions that fit that exact JSON structure, resulting in high-quality, structured quizzes with feedback.

## Why QuizForge is a Better Way to Learn

QuizForge is more than just a tool; it's a complete learning and assessment ecosystem.

* **Active Recall:** It transforms passive reading into active recall, a scientifically proven method for building long-term memory.
* **Instant, Contextual Feedback:** You don't just find out *if* you were wrong, you find out *why*, with AI explanations for every question.
* **AI Study Partner:** The RAG chat assistant acts as a 24/7 tutor, ready to explain complex topics or summarize sections from your own material.
* **Academic Integrity:** For educators, the proctoring features ensure a fair and focused assessment environment, logging violations and automatically handling disqualifications.
* **Data-Driven Insights:** The analytics dashboard gives you (or an educator) powerful insights into which topics are well-understood and which need more work, both for an individual and for an entire group.
