
Barakashop is a full-stack E-commerce platform built to support online mobile phone retail operations. The system provides seamless user experiences for browsing products, managing carts, placing orders, and generating PDF receipts for completed transactions.

Key Features

•	Responsive frontend built with React.js and Tailwind CSS

•	Backend CMS using Strapi connected to PostgreSQL

•	RESTful API for product, user, and order management

•	Customer checkout flow with order confirmation

•	PDF receipt generation

•	Admin interface for managing inventory and orders

Setup Instructions

1. Clone the Repositories

Make sure to clone both the frontend and backend repositories:
git clone https://github.com/Brian-Kibira-Mwangi/barakashop
git clone https://github.com/Brian-Kibira-Mwangi/barakashop-admin

2. Install Dependencies
   
Frontend (Next.js + React)
   cd barakashop
   npm install
Backend (Strapi CMS)
   cd barakashop
   npm install
3. Configure the Database

Ensure you have PostgreSQL installed.

•	Create a database named barakashop_db

•	Update your backend .env file with your DB credentials:

•	DATABASE_CLIENT=postgres

•	DATABASE_NAME=barakashop_db

•	DATABASE_HOST=localhost

•	DATABASE_PORT=5432

•	DATABASE_USERNAME=your_db_user

•	DATABASE_PASSWORD=your_db_password

4. Run the Backend (Strapi)
   
   cd barakashop-backend
   npm run develop
   
This will launch the CMS and generate the necessary tables in your PostgreSQL database.

5. Run the Frontend
    cd barakashop-frontend
    npm run dev
The app will be available at: http://localhost:3000

PDF Generation
Receipts are automatically generated and downloaded in PDF format after a successful order. 
