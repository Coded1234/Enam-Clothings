# Email Verification Setup Guide

## Overview
Email verification has been implemented for new user registrations. Users must verify their email address before they can log in to the system.

## Features Implemented

### 1. Database Changes
- Added `email_verification_token` field to store verification tokens
- Added `email_verified` boolean field (default: false)
- Added `email_verified_at` timestamp field
- Added database index on `email_verification_token` for faster lookups

### 2. Backend Changes

#### User Model (`server/models/User.js`)
- Added new fields for email verification
- Added `generateEmailVerificationToken()` method to create secure verification tokens

#### Auth Controller (`server/controllers/authController.js`)
- **Registration**: Now sends verification email instead of welcome email (welcome email sent after verification)
- **Login**: Checks if email is verified before allowing login
- **New Endpoints**:
  - `GET /api/auth/verify-email/:token` - Verifies email using token
  - `POST /api/auth/resend-verification` - Resends verification email

#### Email Templates (`server/config/email.js`)
- Added `emailVerification` template with verification link

### 3. Frontend Changes

#### New Pages
1. **VerifyEmail** (`/verify-email/:token`)
   - Automatically verifies email when user clicks link
   - Shows success/error messages
   - Redirects to login after successful verification

2. **ResendVerification** (`/resend-verification`)
   - Allows users to request new verification email
   - Shows confirmation after sending

#### Updated Pages
1. **Register** (`/register`)
   - Shows success message after registration
   - Displays email verification instructions
   - No longer logs user in automatically

2. **Login** (`/login`)
   - Checks for email verification errors
   - Shows link to resend verification email if needed

## How It Works

### Registration Flow
1. User fills out registration form
2. Account is created in database with `email_verified = false`
3. Verification token is generated
4. Email sent with verification link: `{CLIENT_URL}/verify-email/{token}`
5. User sees success message asking to check email
6. User cannot log in until email is verified

### Verification Flow
1. User clicks verification link in email
2. Frontend sends token to backend
3. Backend validates token and marks email as verified
4. Welcome email is sent
5. User is redirected to login page

### Login Flow
1. User enters credentials
2. Backend checks if email is verified
3. If not verified, login is denied with message
4. User can click link to resend verification email

## Environment Variables Required

Make sure these are set in your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL for verification links
CLIENT_URL=http://localhost:3000  # or your production URL
```

## Database Migration

### Local Development
Run the migration script:
```bash
node server/scripts/runEmailVerificationMigration.js
```

This will:
- Add the new email verification fields
- Set existing users as verified (so they can still log in)
- Create necessary indexes

### Production (Neon/Supabase)
Execute the SQL file directly in your database dashboard:

1. Go to your Neon/Supabase dashboard
2. Open SQL Editor
3. Copy contents of `server/scripts/addEmailVerification.sql`
4. Execute the SQL

**Note**: The migration automatically marks existing users as verified so they won't be locked out.

## Testing

### Test the Complete Flow

1. **Register a new user**:
   - Go to `/register`
   - Fill out form
   - Submit
   - Check that success message appears

2. **Check email**:
   - Look for verification email in inbox
   - Click verification link
   - Should be redirected to login

3. **Try logging in before verification**:
   - Try to log in without clicking link
   - Should see error message with resend link

4. **Verify email**:
   - Click verification link from email
   - Should see success message
   - Should be redirected to login

5. **Login after verification**:
   - Enter credentials
   - Should log in successfully

### Resend Verification
1. Go to `/resend-verification`
2. Enter email address
3. Check that new email is sent

## Important Notes

### Existing Users
- All existing users are automatically marked as verified by the migration
- They can continue logging in without any issues

### Email Configuration
- Make sure your email service is properly configured
- For Gmail, use an App Password (not your regular password)
- Test email sending in development before deploying

### Security
- Verification tokens are cryptographically secure (32 random bytes)
- Tokens are stored in database and validated on verification
- Tokens are cleared after successful verification

### Production Deployment

1. **Update Environment Variables on Vercel**:
   ```
   CLIENT_URL=https://your-domain.vercel.app
   ```

2. **Run Database Migration**:
   - Execute the SQL in your production database dashboard

3. **Test Email Sending**:
   - Register a test account
   - Verify emails are being sent and received

## Troubleshooting

### Email Not Sending
- Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env
- For Gmail, enable "Less secure app access" or use App Password
- Check server logs for email errors

### Verification Link Not Working
- Ensure CLIENT_URL environment variable is correct
- Check that routes are properly added in App.js
- Verify token exists in database

### Users Can't Log In
- Check if email is verified in database
- Provide resend verification link
- For existing users, manually update database if needed:
  ```sql
  UPDATE users SET email_verified = true WHERE email = 'user@example.com';
  ```

## Future Enhancements

Possible improvements:
- Token expiration (currently tokens don't expire)
- Rate limiting on resend verification requests
- Email verification reminders
- Phone number verification
- Two-factor authentication
