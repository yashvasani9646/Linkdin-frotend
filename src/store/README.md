# Redux Store - User Data Management

## Overview

Redux store is now configured to manage user authentication state and user data globally across the application.

## Store Structure

```javascript
{
  auth: {
    user: null | Object,      // User data from login
    isAuthenticated: boolean, // Authentication status
    loading: boolean,         // Loading state
    error: null | string      // Error messages
  }
}
```

## Available Actions

### `setUser(userData)`

Store user data in Redux state

```javascript
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/authSlice";

const dispatch = useDispatch();
dispatch(
  setUser({
    id: "123",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    // ... other user fields
  })
);
```

### `setTokens({ accessToken, refreshToken })`

Store authentication tokens (also saves to localStorage)

```javascript
dispatch(
  setTokens({
    accessToken: "your-access-token",
    refreshToken: "your-refresh-token",
  })
);
```

### `clearUser()`

Clear all user data and tokens (logout)

```javascript
dispatch(clearUser());
```

### `updateUser(updates)`

Update specific user fields

```javascript
dispatch(
  updateUser({
    firstName: "Jane",
    avatar: "new-avatar-url.jpg",
  })
);
```

### `setLoading(boolean)`

Set loading state

```javascript
dispatch(setLoading(true));
```

### `setError(message)`

Set error message

```javascript
dispatch(setError("Something went wrong"));
```

## Selectors (Reading Data)

### Basic Usage

```javascript
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";

function MyComponent() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return <div>{isAuthenticated && <p>Welcome, {user?.firstName}!</p>}</div>;
}
```

### All Available Selectors

```javascript
import {
  selectUser, // Get user object
  selectIsAuthenticated, // Get auth status
  selectAuthLoading, // Get loading state
  selectAuthError, // Get error message
} from "../store/slices/authSlice";
```

## Example: Using User Data in a Component

```javascript
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";

function ProfileComponent() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>
        Name: {user?.firstName} {user?.lastName}
      </p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
    </div>
  );
}
```

## Example: Updating User Data

```javascript
import { useDispatch } from "react-redux";
import { updateUser } from "../store/slices/authSlice";

function EditProfileComponent() {
  const dispatch = useDispatch();

  const handleSave = (newData) => {
    dispatch(updateUser(newData));
  };

  return (
    <button onClick={() => handleSave({ firstName: "Jane" })}>
      Update Name
    </button>
  );
}
```

## Integration Points

### Sign In (SignInPage.jsx)

- ✅ Uses `setUser()` to store user data
- ✅ Uses `setTokens()` to store authentication tokens

### Sign Out (ProtectedNavBar.jsx)

- ✅ Uses `clearUser()` to logout

### Protected Routes

- Can check `selectIsAuthenticated` for additional validation
- Can check `selectUser` for role-based access

## Benefits

1. **Global Access**: User data accessible from any component
2. **Single Source of Truth**: No prop drilling needed
3. **Automatic Persistence**: Tokens saved to localStorage
4. **Type Safety**: Consistent data structure
5. **Easy Updates**: Simple actions for common operations

## Next Steps

You can now:

- Access user data in any component using `useSelector(selectUser)`
- Update user data from any component using `updateUser()`
- Check authentication status using `selectIsAuthenticated`
- Build role-based features using user data from Redux
