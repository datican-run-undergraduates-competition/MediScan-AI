# AI-Med System Local Deployment Guide
*For Windows PC Installation*

## Prerequisites

### Required Software
1. **Node.js**
   - Download and install Node.js 16.x or higher from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - Verify installation by opening Command Prompt and typing:
     ```bash
     node --version
     npm --version
     ```

2. **MongoDB**
   - Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
   - During installation:
     - Choose "Complete" installation
     - Install MongoDB Compass (the GUI tool) when prompted
     - Let it install as a service

3. **Redis for Windows**
   - Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
   - Download the latest .msi installer
   - Run the installer and follow the prompts
   - Let it install as a service

## Installation Steps

1. **Clone the Repository**
   ```bash
   # Open Command Prompt and navigate to your desired directory
   cd C:\Users\YourUsername\Documents
   
   # Clone the repository
   git clone https://github.com/your-org/ai-med-system.git
   cd ai-med-system
   ```

2. **Install Dependencies**
   ```bash
   # Install project dependencies
   npm install
   ```

3. **Environment Setup**
   - Create a new file named `.env` in the project root
   - Copy the following content into it:
     ```
     NODE_ENV=development
     PORT=3000
     MONGODB_URI=mongodb://localhost:27017/aimed
     REDIS_URL=redis://localhost:6379
     JWT_SECRET=your-local-secret-key
     ```

4. **Database Setup**
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017`
   - Create a new database named `aimed`
   - The application will create necessary collections automatically

5. **Start the Application**
   ```bash
   # Start the development server
   npm run dev
   ```

## Accessing the Application

1. Open your web browser
2. Navigate to: `http://localhost:3000`
3. You should see the AI-Med System login page

## Troubleshooting

### Common Issues and Solutions

1. **Port Already in Use**
   - If port 3000 is already in use, you can change it in the `.env` file
   - Or find and close the application using port 3000:
     ```bash
     # Find process using port 3000
     netstat -ano | findstr :3000
     # Kill the process (replace PID with the number from above)
     taskkill /PID <PID> /F
     ```

2. **MongoDB Connection Issues**
   - Ensure MongoDB service is running:
     ```bash
     # Open Services (services.msc)
     # Find "MongoDB" and ensure it's running
     ```
   - Or restart MongoDB service:
     ```bash
     net stop MongoDB
     net start MongoDB
     ```

3. **Redis Connection Issues**
   - Ensure Redis service is running:
     ```bash
     # Open Services (services.msc)
     # Find "Redis" and ensure it's running
     ```
   - Or restart Redis service:
     ```bash
     net stop Redis
     net start Redis
     ```

4. **Node.js Issues**
   - Clear npm cache:
     ```bash
     npm cache clean --force
     ```
   - Delete node_modules and reinstall:
     ```bash
     rm -rf node_modules
     npm install
     ```

## Development Tools

1. **MongoDB Compass**
   - Use this GUI tool to view and manage your database
   - Access at: `mongodb://localhost:27017`

2. **Redis Commander** (Optional)
   - Install Redis Commander for a GUI to manage Redis:
     ```bash
     npm install -g redis-commander
     redis-commander
     ```
   - Access at: `http://localhost:8081`

## Stopping the Application

1. **Stop the Server**
   - Press `Ctrl + C` in the terminal where the server is running
   - Or close the terminal window

2. **Stop Services** (if needed)
   ```bash
   # Stop MongoDB
   net stop MongoDB
   
   # Stop Redis
   net stop Redis
   ```

## Backup and Restore

1. **Backup Database**
   ```bash
   # Create backup directory
   mkdir C:\backup\aimed
   
   # Export database
   mongodump --db aimed --out C:\backup\aimed
   ```

2. **Restore Database**
   ```bash
   # Restore from backup
   mongorestore --db aimed C:\backup\aimed\aimed
   ```

## Security Notes

1. This is a development setup and should not be used in production
2. The JWT secret in `.env` is for local development only
3. Do not expose this setup to the internet
4. Keep your `.env` file secure and never commit it to version control

## Support

For local development support:
- Email: support@genovotechnologies.com
- Include "Local Development" in the subject line

---

*This guide is for local development purposes only. For production deployment, refer to the main deployment guide.* 