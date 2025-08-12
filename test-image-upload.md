# Image Upload Testing Guide

## Backend Setup Verification

### 1. Check Uploads Directory
```bash
cd backend
ls -la uploads/
```
Expected: Should show the uploads directory with read/write permissions.

### 2. Check Server Logs
Start the server and look for:
```
Created uploads directory: /path/to/backend/uploads
Server running on port 5000
```

### 3. Test Image Upload Endpoint
```bash
# Test with curl (replace YOUR_TOKEN with actual token)
curl -X POST http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/test-image.jpg"
```

## Frontend Testing

### 1. Profile Image Upload
1. **Login** to the app
2. **Go to Profile** screen
3. **Tap edit icon** on profile image
4. **Select image** from gallery
5. **Check console** for any errors
6. **Verify image** appears after upload

### 2. Product Image Upload
1. **Go to Post** screen (requires login)
2. **Tap image picker** area
3. **Select image** from gallery
4. **Fill other fields** (title, price, description, category)
5. **Submit form**
6. **Check console** for upload progress
7. **Verify product** appears on Home screen

## Common Issues & Solutions

### ❌ "Permission denied" error
- **Solution**: Check camera/gallery permissions in app settings
- **Fix**: Reinstall app or reset permissions

### ❌ "Upload failed" error
- **Check**: Backend server is running
- **Check**: Network connectivity
- **Check**: Image file size (should be < 5MB)

### ❌ Image not displaying after upload
- **Check**: Backend uploads directory exists
- **Check**: Image path in database
- **Check**: Frontend image URI construction

### ❌ "File too large" error
- **Solution**: Compress image or select smaller image
- **Limit**: 5MB maximum file size

## Debug Steps

### 1. Enable Console Logging
Check browser/React Native console for:
- Image picker results
- Upload progress
- API responses
- Error messages

### 2. Check Network Tab
Look for:
- Image upload requests
- Response status codes
- Error messages

### 3. Verify Backend
```bash
# Check if uploads directory exists
ls -la backend/uploads/

# Check server logs
tail -f backend/server.log

# Test endpoint directly
curl -X POST http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg"
```

## Expected Behavior

### ✅ Successful Upload
1. Image picker opens
2. Image selected and displayed
3. Upload progress shown
4. Success message displayed
5. Image persists after app restart

### ✅ Error Handling
1. Clear error messages
2. Graceful fallback to previous image
3. User-friendly alerts
4. Console logging for debugging

## File Size Limits
- **Profile Images**: 5MB max
- **Product Images**: 5MB max
- **Supported Formats**: JPG, JPEG, PNG
- **Recommended Size**: 1024x1024 or smaller

## Troubleshooting Checklist

- [ ] Backend server running
- [ ] Uploads directory exists
- [ ] Proper permissions set
- [ ] Image picker working
- [ ] Network requests successful
- [ ] Database updated
- [ ] Frontend displaying images
- [ ] Error handling working
