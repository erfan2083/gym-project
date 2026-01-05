# راهنمای راه‌اندازی چت با هوش مصنوعی (Gemini AI)

## مراحل نصب و راه‌اندازی

### 1. دریافت API Key از Google Gemini

1. به سایت [Google AI Studio](https://makersuite.google.com/app/apikey) بروید
2. با حساب Google خود وارد شوید
3. روی "Get API Key" کلیک کنید و یک API Key جدید بسازید
4. API Key را کپی کنید

### 2. تنظیم Backend

1. فایل `Backend/.env` را باز کنید
2. مقدار `GEMINI_API_KEY` را با API Key دریافتی جایگزین کنید:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

3. سرور Backend را restart کنید:

```bash
cd Backend
npm start
```

## ویژگی‌های چت با AI

### برای کاربر (Client):

1. وارد تب **برنامه تمرینی** (Workout) شوید
2. در بالای صفحه، دو آیکون مشاهده می‌کنید:
   - **آیکون چت** (Entypo chat): برای چت با مربی
   - **آیکون روبات** (MaterialIcons smart-toy): برای چت با هوش مصنوعی

3. روی آیکون روبات کلیک کنید
4. دکمه "شروع گفتگو" را بزنید
5. هوش مصنوعی به عنوان یک مربی حرفه‌ای، برنامه تمرینی شما را تحلیل می‌کند و نظر می‌دهد
6. می‌توانید هر سوالی درباره برنامه تمرینی خود بپرسید

## API Endpoints

### POST `/api/ai-chat/start`
شروع چت و ارسال برنامه تمرینی کاربر به AI

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "نظر AI درباره برنامه تمرینی",
  "workoutProgram": "متن کامل برنامه تمرینی"
}
```

### POST `/api/ai-chat/message`
ارسال پیام به AI

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "message": "سوال کاربر",
  "conversationHistory": [
    {"sender": "user", "text": "پیام قبلی"},
    {"sender": "ai", "text": "پاسخ AI"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "پاسخ AI"
}
```

## فایل‌های تغییر یافته

### Backend:
- ✅ `Backend/controllers/aiChatController.js` - Controller جدید برای AI chat
- ✅ `Backend/routes/aiChatRoutes.js` - Routes جدید
- ✅ `Backend/app.js` - اضافه شدن AI chat routes
- ✅ `Backend/.env` - اضافه شدن GEMINI_API_KEY
- ✅ `Backend/package.json` - اضافه شدن @google/generative-ai

### Frontend (Mobile App):
- ✅ `mobile-app/src/components/home/AIChatOverlay.js` - کامپوننت جدید برای چت با AI
- ✅ `mobile-app/src/screens/home/HomeScreen.js` - اضافه شدن state و handlers
- ✅ `mobile-app/src/components/home/CoachAthletePlanScreen.js` - اضافه شدن دکمه AI chat

## نکات مهم

1. **امنیت**: API Key را هرگز در کد frontend قرار ندهید
2. **محدودیت‌ها**: Gemini API ممکن است محدودیت rate limit داشته باشد
3. **هزینه**: استفاده از Gemini API ممکن است هزینه داشته باشد (بسته به پلن شما)
4. **زبان فارسی**: AI به خوبی زبان فارسی را پشتیبانی می‌کند

## عیب‌یابی

### خطا: "Invalid API Key"
- مطمئن شوید API Key را صحیح در `.env` قرار داده‌اید
- سرور را restart کنید

### خطا: "هیچ برنامه تمرینی ثبت نشده"
- ابتدا مربی باید برای کاربر برنامه تمرینی ثبت کند
- مطمئن شوید کاربر اشتراک فعال دارد

### چت باز نمی‌شود
- مطمئن شوید که در تب "برنامه تمرینی" هستید
- Console را بررسی کنید برای خطاهای احتمالی

## پشتیبانی

برای هرگونه مشکل یا سوال، یک Issue در GitHub ایجاد کنید.
