# IKONEX Academy - Frontend

React 19 + Vite admin interface for the IKONEX Academy Student Management System.

## Features

- Corporate ERP-style interface with clean, professional design
- JWT-based authentication with session management
- Stream, Student, Subject, and Score management
- Real-time dashboard with statistics
- PDF report generation and download
- Responsive layout with data density optimization

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Lucide React (icons)
- jsPDF + AutoTable (PDF generation)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5178/api
```

For production deployment, set `VITE_API_BASE_URL` to your backend API URL.

## Project Structure

```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── routes/        # Route configuration
│   ├── utils/         # Utility functions
│   ├── config/        # Configuration files
│   ├── App.jsx        # Main app component
│   ├── main.jsx       # Entry point
│   ├── index.css      # Global styles
│   └── App.css        # Component styles
├── public/            # Static assets
└── index.html         # HTML template
```

## Styling

The application uses a corporate ERP aesthetic with:
- Light mode design (#F8F9FA background)
- Corporate navy blue (#1E3A8A) for primary actions
- System sans-serif fonts (Inter, Segoe UI, Arial)
- Crisp 1px borders (#E2E8F0)
- Sharp edges (4px border-radius)
- High data density for information efficiency

## Authentication

The frontend uses JWT tokens stored in localStorage for authentication. All API requests include the `Authorization: Bearer <token>` header.

## Pages

- **Dashboard** - Overview statistics and quick actions
- **Stream Manager** - Create streams, assign subjects, view leaderboards
- **Student Roster** - Register, edit, and delete students
- **Subject Deck** - Manage syllabus subjects
- **Scoring Board** - Record and edit student scores
- **Admin Deck** - Register additional admin accounts

## PDF Generation

The application uses jsPDF with AutoTable plugin to generate:
- Individual student report cards
- Class performance leaderboards
- Subject breakdown reports

For detailed documentation, see the main [README.md](../README.md) and [USER_GUIDE.md](../USER_GUIDE.md).
