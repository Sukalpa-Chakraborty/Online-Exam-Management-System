ExamSphere
A Role-Based Online Exam Management System

ExamSphere is a modern web-based Online Exam Management System designed to simplify the process of creating, managing, conducting, and evaluating examinations.

The platform provides dedicated dashboards and features for Students, Teachers, and Administrators, offering a secure and structured environment for online examinations, class management, question management, result evaluation, and performance analytics.

Features
Student Features
Secure registration and login
Role-based access control
View available and upcoming examinations
View detailed exam information and instructions
Attempt timed online examinations
Navigate between questions during an exam
Support for different question types
View examination results
Track previous examination attempts
View examination history
Join and manage enrolled classes
Edit profile information
Teacher Features
Dedicated teacher dashboard
Create and edit examinations
Publish and manage examinations
Add, edit, and manage questions
Question bank for reusable questions
Support for multiple question types
Create and manage classes
View class details and student information
Evaluate short-answer questions
View examination and student performance analytics
Manage examination results
Admin Features
Dedicated administrator dashboard
Manage platform users
View detailed user information
Manage classes across the platform
Monitor examinations
View platform-wide analytics
Track system activity through activity logs
Monitor ongoing examination activity
User Roles

ExamSphere supports three primary user roles:

Role	Description
Student	Can join classes, attempt exams, view results, and track examination history.
Teacher	Can create exams, manage questions and classes, evaluate answers, and analyze student performance.
Admin	Can manage users, classes, examinations, analytics, monitoring, and platform activity.
Tech Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
React Router
Lucide React
Recharts
Backend & Services
Firebase Authentication
Cloud Firestore
Firebase Storage
Core Modules
Authentication and Authorization
Role-Based Access Control
Student Dashboard
Teacher Dashboard
Admin Dashboard
Examination Management
Timed Online Examination System
Question Management
Question Bank
Class Management
Result Management
Short Answer Evaluation
Performance Analytics
Admin Monitoring
Activity Logs
User Profile Management
Theme Management
Project Structure
src/
├── components/
│   ├── auth/
│   │   └── AuthLayout.tsx
│   ├── common/
│   │   └── DateTimePicker.tsx
│   └── layout/
│       └── DashboardLayout.tsx
│
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
│
├── firebase/
│   └── firebase.ts
│
├── pages/
│   ├── admin/
│   ├── auth/
│   ├── profile/
│   ├── student/
│   └── teacher/
│
├── routes/
│   └── AppRoutes.tsx
│
├── services/
│   ├── adminService.ts
│   ├── authService.ts
│   ├── classService.ts
│   ├── evaluationService.ts
│   ├── examService.ts
│   ├── notificationService.ts
│   └── resultService.ts
│
├── types/
│   ├── exam.ts
│   └── user.ts
│
├── App.tsx
├── main.tsx
└── index.css
Getting Started
Prerequisites

Before running the project, make sure you have the following installed:

Node.js
npm
A Firebase project
Installation

Clone the repository:

git clone https://github.com/Sukalpa-Chakraborty/Online-Exam-Management-System.git

Navigate to the project directory:

cd Online-Exam-Management-System

Install the required dependencies:

npm install
Environment Variables

Create a .env file in the root directory of the project and add your Firebase configuration.

Example:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

Note: Never commit your .env file or expose your sensitive credentials publicly.

Running the Application

Start the development server:

npm run dev

The application will then be available at the local URL displayed in your terminal.

Available Scripts
Run Development Server
npm run dev

Starts the application in development mode.

Create Production Build
npm run build

Runs the TypeScript build check and creates an optimized production build.

Run Linter
npm run lint

Checks the project for linting and code quality issues.

Preview Production Build
npm run preview

Runs a local preview of the production build.

Application Design

ExamSphere is designed to provide a clean and structured user experience across different roles.

Responsive layouts
Role-specific dashboards
Protected routes
Consistent navigation
Structured examination workflow
Interactive forms and feedback
Performance visualization
Light and dark theme support
Clean data management interfaces
Future Improvements
Profile picture upload for Students, Teachers, and Admins
Email notifications
Advanced exam monitoring
Enhanced reporting and analytics
Downloadable result reports
Certificate generation
Improved accessibility
Additional notification preferences
Author

Sukalpa Chakraborty

CSE Student | Full Stack Developer

GitHub Profile

Contributing

Contributions, suggestions, and improvements are welcome. Feel free to fork this repository and submit a pull request.

License

This project is currently intended for educational, learning, and portfolio purposes.
