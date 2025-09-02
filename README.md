# **Cover Letter Genius ✨** > [Live Demo](https://covergenius.pages.dev/)

Tired of writing cover letters from scratch? **Cover Letter Genius** is a powerful web application that leverages the Google Gemini AI to automatically generate professional, tailored cover letters in seconds. Simply upload your CV, provide a job description and some company info, and let the AI do the heavy lifting\!

The application is built with a serverless backend using **Cloudflare Workers** and a clean, lightweight frontend using vanilla **HTML, CSS, and JavaScript**.

## **⭐ Features**

* **🤖 AI-Powered Generation**: Uses Google's Gemini models (gemini-2.5-pro or gemini-2.5-flash) to create compelling and relevant cover letter content.  
* **📄 Automatic CV Parsing**: Intelligently extracts your name, email, phone, and address from your uploaded PDF resume to pre-fill the letter.  
* **✍️ Optional Overrides**: Don't like the extracted info? Manually enter your name, email, and location to ensure perfect accuracy.  
* **📄 Professional PDF Output**: Generates a clean, well-formatted, and ready-to-send PDF cover letter.  
* **🎨 Light & Dark Mode**: Includes a theme toggle for a comfortable user experience.  
* **🚀 Serverless & Fast**: The backend is deployed on Cloudflare's edge network for global speed and reliability.  
* **🔒 Secure & Private**: Your API key is sent directly to your own secure backend worker and is never exposed on the frontend.

## **🛠️ Tech Stack**

* **Frontend**:  
  * HTML5  
  * CSS3 (with variables for theming)  
  * Vanilla JavaScript  
  * **pdf.js**: To parse PDF resumes directly in the browser.  
* **Backend**:  
  * **Cloudflare Workers**: For serverless compute on the edge.  
  * **Hono**: A small, simple, and ultrafast web framework for Cloudflare Workers.  
  * **pdf-lib**: For creating and modifying PDF documents in JavaScript.  
  * **@pdf-lib/fontkit**: To embed custom fonts for full Unicode support in PDFs.  
* **AI**:  
  * **Google Gemini API**: For all language model processing tasks.

## **🏗️ Project Structure**

The project is organized into two main parts: the frontend and the backend worker.
```
cover-letter-genius/  
├── frontend/  
│   └── index.html       \# The single, self-contained frontend application.  
└── backend/  
    ├── src/  
    │   ├── index.ts     \# The main worker logic (API endpoint, AI calls, PDF generation).  
    │   └── font.ts      \# Base64 encoded font data to ensure PDF compatibility.  
    ├── package.json     \# Backend dependencies.  
    ├── tsconfig.json    \# TypeScript configuration.  
    └── wrangler.toml    \# Cloudflare Worker configuration file.
```
## **🚀 Setup and Deployment Guide**

Follow these steps to set up the project and deploy your own version.

### **Prerequisites**

1. **Node.js & npm**: Ensure you have Node.js and npm installed.  
2. **Cloudflare Account**: [Sign up for a free Cloudflare account](https://www.google.com/search?q=https://dash.cloudflare.com/sign-up).  
3. **Wrangler CLI**: The command-line tool for Cloudflare Workers. Install it globally:  
```   npm install \-g wrangler```

4. **Google Gemini API Key**: Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### **1\. Backend Setup (Cloudflare Worker)**

First, let's deploy the serverless backend.

1. **Clone the Repository**:  
   ```git clone \<your-repo-url\>  ```
  ``` cd cover-letter-genius/backend```

2. **Install Dependencies**:  
   ```npm install```

3. Authenticate Wrangler:  
   Log in to your Cloudflare account to authorize the Wrangler CLI.  
   ```wrangler login```

4. Deploy the Worker:  
   This command will build and deploy your worker to the Cloudflare network.  
  ```wrangler deploy```

5. Get Your Worker URL:  
   After a successful deployment, Wrangler will output your worker's URL. It will look something like this: https://your-worker-name.your-subdomain.workers.dev. Copy this URL, as you'll need it for the frontend.

### **2\. Frontend Setup & Deployment**

Now, let's connect the frontend to your newly deployed backend.

1. **Update the Worker URL**:  
   * Open the frontend/index.html file in a text editor.  
   * Find the JavaScript constant named WORKER\_URL.  
   * Replace the placeholder URL with the URL of your deployed worker from the previous step.

// Find this line in frontend/index.html  
```const WORKER\_URL \= '\[https://your-worker-name.your-subdomain.workers.dev/api/generate\](https://your-worker-name.your-subdomain.workers.dev/api/generate)';```

2. Deploy the Frontend (Using Cloudflare Pages):  
   The easiest way to host the index.html file is with Cloudflare Pages.  
   * Log in to your Cloudflare dashboard.  
   * Go to **Workers & Pages** \> **Create application** \> **Pages** \> **Upload assets**.  
   * Give your project a name (e.g., cover-letter-genius).  
   * Drag and drop the frontend/index.html file into the upload area.  
   * Click **Deploy site**.

Cloudflare will give you a public URL for your frontend (e.g., https://cover-letter-genius.pages.dev). You're now live\!

## **kullanım**

1. Navigate to your deployed Cloudflare Pages URL.  
2. Enter your **Google Gemini API Key** into the first input field.  
3. Choose your preferred Gemini model.  
4. Upload your resume in PDF format.  
5. Paste the job description you are applying for.  
6. Add some information about the company or why you want to work there.  
7. (Optional) If the automatic extraction from your CV is incorrect or you want to use different details, fill in the optional **Full Name**, **Email**, and **Location** fields.  
8. Click **Generate Cover Letter**. Your PDF will be generated and downloaded automatically.

## **Contributing**

Contributions are welcome\! Please feel free to fork the repository, make your changes, and submit a pull request.

1. Fork the repository.  
2. Create your feature branch (git checkout \-b feature/AmazingFeature).  
3. Commit your changes (git commit \-m 'Add some AmazingFeature').  
4. Push to the branch (git push origin feature/AmazingFeature).  
5. Open a Pull Request.

## **📄 License**

This project is licensed under the MIT License \- see the LICENSE file for details.
