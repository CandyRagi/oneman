# UniMan

UniMan is a comprehensive material management application designed for construction sites and storage facilities. It helps users track inventory, manage locations, and leverage AI assistance for quick insights.

## Features

-   **Site & Store Management**: Create and manage multiple construction sites and storage locations.
-   **Material Tracking**: Keep track of materials, quantities, and units for each location.
-   **UniBot AI Assistant**: A built-in AI assistant powered by **Google Gemini** that can answer questions about your inventory (e.g., "How much cement do we have across all sites?").
-   **Real-time Updates**: Powered by **Firebase Firestore** for instant data synchronization.
-   **Secure Authentication**: User authentication via **Firebase Auth**.
-   **Image Management**: Upload and manage location photos using **Cloudinary**.
-   **PWA Support**: Installable as a Progressive Web App for mobile access.
-   **Modern UI**: Built with **Next.js 15**, **React 19**, and **Tailwind CSS 4** for a fast and responsive experience.

## Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS 4
-   **Database**: Firebase Firestore
-   **Authentication**: Firebase Auth
-   **AI**: Google Generative AI (Gemini)
-   **Storage**: Cloudinary

## Getting Started

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm, yarn, pnpm, or bun

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd oneman
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Environment Variables

Create a `.env` file in the root directory and add the following configuration keys:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Cloudinary Configuration (Server-side)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Running the App

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about the technologies used in this project:

-   [Next.js Documentation](https://nextjs.org/docs)
-   [Firebase Documentation](https://firebase.google.com/docs)
-   [Google AI Studio (Gemini)](https://ai.google.dev/)
-   [Tailwind CSS](https://tailwindcss.com/)
