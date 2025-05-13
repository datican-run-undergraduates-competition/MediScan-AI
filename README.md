# 🧠 AI in Medicine – Intelligent Healthcare Assistant

## 🔬 Overview  
**AI-Med** is a smart, interactive web-based platform designed to revolutionize healthcare through artificial intelligence. It simulates a diagnostic assistant that helps users understand potential causes of illness, recommends treatments, and visualizes health trends—all in real time.
**AI-Med** is an innovative web platform that merges healthcare with artificial intelligence. It provides real-time diagnosis support, symptom prediction, voice interaction, and even image-based analysis—all through a user-friendly, futuristic interface. The goal is to showcase how AI can revolutionize the way we understand, monitor, and manage health.

Trained using *The Gale Encyclopedia of Medicine (Second Edition)*, our AI leverages medically reviewed information to provide reliable and educational feedback to users.
This project demonstrates how AI can enhance decision-making in medicine, reduce the burden on healthcare workers, and empower patients with better health insights.
---

## 🚀 Key Features

### 🔐 Secure Authentication  
- JWT-based login system with session management  
- “Forgot Password?” reset functionality  
- Clean, modern UI with a medical + futuristic aesthetic

  ### 💬 AI-Powered Chatbot Assistant  
- Engages users in real-time conversation  
- Responds to health-related questions and gives AI-driven suggestions  
- Offers context-aware follow-up questions for a smarter experience  

### 🗣️ Voice Chat System  
- Hands-free interaction using voice commands  
- Converts speech to text for processing by the AI model  
- Improves accessibility for a broader range of users  

### 🖼️ Image Upload & Diagnosis 
- Allows users to upload images (e.g., skin conditions, x-rays)  
- AI analyzes visual symptoms to provide diagnostic suggestions  
- Expands the tool’s use beyond text and voice inputs  

### 🧠 AI Diagnosis Engine  
- Trained on *The Gale Encyclopedia of Medicine (2nd Ed.)*  
- Predicts possible causes of sickness based on symptoms, age, and more  
- Returns a ranked list of conditions with confidence scores  
- Designed for transparency and explainability (SHAP planned)  

### 📊 Interactive Dashboard  
-Visualized data from chats, predictions, and usage trends
- Displays personal health insights and history  
- Fully responsive, dark-mode support, animated for a futuristic feel  

### 🗂️ Chat History    
- Users can view and revisit previous conversations with the AI  
- Useful for tracking symptoms and AI recommendations over time  


## 🛠️ Tech Stack

| Layer        | Tools & Technologies                         |
|--------------|----------------------------------------------|
| Frontend     | HTML, CSS, Bootstrap, JavaScript             |
| Backend      | Python (Flask), Flask Extensions             |
| AI/ML Model  | Scikit-learn, Pandas, Gemini  |
| Database     | SQLite (development) → PostgreSQL/MySQL      |
| Auth & Security | JWT, Flask-Login       
| Tools        | Postman, cURL, Git, VS Code                  |

---

## ⚙️ Getting Started

```bash
1. Clone the Repository
git clone https://github.com/your-username/ai-in-medicine.git
cd ai-in-med

2.Set up Python Envrionment 
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate

3. Install dependencies
pip install -r requirements.txt

4. Apply Migrations (for Django)
python manage.py makemigrations
python manage.py migrate

5. Run the Server
python app.py
```

## 📚 AI Training Data Source
The Gale Encyclopedia of Medicine – Second Edition
Our AI diagnosis engine was trained on medically-reviewed content from this authoritative source to ensure educational accuracy and consistency.

## 🧪 Usage

After launching the application, here’s how to get started:

### 🧍 1. Create an Account or Login
- Click “Register” to create a new user account.
- Already have one? Just log in with your email and password.
- You can use the “Forgot Password?” feature to reset your password.

### 💬 2. Interact with the AI Chatbot
- Type your health-related questions or symptoms in the chat box.
- The AI will respond with possible diagnoses, follow-up questions, or advice.
- Example:  
  > "I’ve had a headache and sore throat for two days."

### 🗣️ 3. Use Voice Chat (Optional)
- Click the **microphone icon** to speak instead of typing.
- The AI will convert your voice to text and respond normally.
- Ideal for users with accessibility needs or mobile users.

### 🖼️ 4. Upload an Image (Optional)
- Go to the **Image Diagnosis** section.
- Upload an image of a visible symptom (e.g., skin rash).
- The AI will analyze it and return a prediction (in progress).

### 🧠 5. View Predictions
- AI suggests potential causes based on symptoms and input data.
- Each diagnosis includes a **confidence score** and possible next steps.
- Predictions are based on content from *The Gale Encyclopedia of Medicine (2nd Ed.)*.

### 📊 6. Check Your Dashboard
- Track past chats, predictions, and image analysis.
---
## 🌍 Project Impact

AI in Medicine aims to bridge the gap between individuals and accessible healthcare by providing:

### ✅ Early Symptom Awareness
Many people delay seeing a doctor due to minor symptoms. Our AI encourages **early self-assessment**, helping users understand when to seek real medical help.

### 🧠 Medical Education & Empowerment
By using medically reviewed sources and explainable outputs, the system serves as a learning tool for: Students, Health educators,Curious individuals (looking to understand their health better)

### 📈 Accessibility & Inclusivity
With built-in **voice chat** and **image upload**, the platform supports a wide range of users—especially those with:
- Visual impairments (voice)
- Language barriers
- Low digital literacy (intuitive interface)

### 💡 Proof of AI's Potential in Healthcare
The project demonstrates how AI, when trained responsibly, can:
- Analyze symptoms
- Interpret images
- Converse naturally with users  
This makes it a **powerful showcase** of AI's role in **next-generation healthcare solutions**.

---
## 🧑‍💻 Team
- Olokor Samuel Oroghene – Backend & Frontend Developer, Project Coordinator

- Emmanuel OLuyemi– Backend and ML Engineer

## 📜 License
This project is licensed under the MIT License.

## 🙏 Acknowledgements

We would like to thank the following individuals and resources for making this project possible:

- **Our Project Team** – for their dedication in developing, training, designing, and testing the entire system.
- **RUNACOSS** and **DATICAN** for Organizing this Competition.
- **The Gale Encyclopedia of Medicine (Second Edition)** – our primary data source for training the AI model with medically accurate information.
- **Redemmer's University** 
> *This project would not be possible without the spirit of collaboration, open-source technology, and a shared passion for innovation in healthcare.*


> 💬 *“Our goal isn’t to replace doctors, but to assist users with reliable, AI-powered insight—right from their fingertips.”*





