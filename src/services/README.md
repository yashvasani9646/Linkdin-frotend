# API Integration Structure

This project uses a centralized API configuration structure for better maintainability and scalability.

## Folder Structure

```
src/
├── config/
│   └── api.config.js          # Centralized API endpoint configuration
├── services/
│   ├── api.js                 # Axios instance with interceptors
│   ├── authService.js         # Authentication-related API calls
│   └── [otherServices].js     # Other domain-specific services
└── components/
    └── ...
```

## How It Works

### 1. API Configuration (`src/config/api.config.js`)

Defines all API endpoints in a centralized location:

```javascript
export const API_CONFIG = {
  BASE_URL: "http://localhost:5502",
  ENDPOINTS: {
    AUTH: {
      REGISTER: "/api/v1/auth/register",
      VERIFY_OTP: "/api/v1/auth/verifyOtp",
      // ... more endpoints
    },
    // ... more categories
  },
};
```

### 2. Axios Instance (`src/services/api.js`)

Pre-configured axios instance with:

- Base URL from config
- Request/response interceptors
- Automatic token handling
- Token refresh logic

### 3. Service Files (`src/services/*.js`)

Domain-specific service files with clean API methods:

```javascript
import api from "./api";
import { API_CONFIG } from "../config/api.config";

export const authService = {
  register: async (userData) => {
    const response = await api.post(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      userData
    );
    return response.data;
  },
  // ... more methods
};
```

### 4. Usage in Components

Clean and simple API calls:

```javascript
import { authService } from "../../services/authService";

// In your component
const handleSubmit = async () => {
  try {
    const response = await authService.register(userData);
    // console.log(response);
  } catch (error) {
    // console.error(error);
  }
};
```

## Benefits

✅ **Centralized Configuration**: All API endpoints in one place  
✅ **Easy to Update**: Change base URL or endpoints from one location  
✅ **Type Safety**: Clear method signatures with JSDoc  
✅ **Error Handling**: Consistent error handling via interceptors  
✅ **Token Management**: Automatic token refresh and storage  
✅ **Reusability**: Service methods can be used across components  
✅ **Testability**: Easy to mock service methods for testing

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_BASE_URL=http://localhost:5502
```

For production:

```
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Available Services

### authService

- `register(userData)` - Register new user
- `verifyOtp(otp, tempToken)` - Verify OTP
- `resendOtp(tempToken)` - Resend OTP
- `login(credentials)` - Login user
- `logout()` - Logout user
- `getCurrentUser()` - Get current user data
- `forgotPassword(email)` - Request password reset
- `resetPassword(token, newPassword)` - Reset password

## Adding New Services

1. Create a new service file in `src/services/`
2. Add endpoints to `api.config.js`
3. Import and use the API instance
4. Export service methods

Example:

```javascript
// src/services/jobService.js
import api from "./api";
import { API_CONFIG } from "../config/api.config";

export const jobService = {
  getJobs: async () => {
    const response = await api.get(API_CONFIG.ENDPOINTS.JOBS.LIST);
    return response.data;
  },
  // ... more methods
};
```
