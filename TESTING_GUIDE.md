# מדריך בדיקות מהירות למערכת האימות החדשה

## בדיקות שכדאי לבצע עכשיו:

### ✅ ריענון הדפדפן משמר התחברות (localStorage)
1. התחבר במערכת
2. רענן את הדפדפן (F5)
3. ודא שאתה עדיין מחובר ולא מופנה ל-/login

### ✅ "התנתק" מוחק localStorage ומחזיר ל־/login
1. לחץ על כפתור "התנתק"
2. ודא שהופנית ל-/login
3. בדוק ב-Developer Tools שה-localStorage נוקה

### ✅ business_id נטען ל-context ומחלחל לכל דפי CRUD
1. התחבר למערכת
2. ודא שמוצג business_id: 11111111-1111-1111-1111-111111111111
3. בדוק שהוא מועבר בקריאות API

### ✅ קריאות ל-API כוללות את ה-business_id בפילטר/פרמטר
1. פתח Developer Tools → Network
2. לחץ "טען עובדים"
3. ודא שהקריאה ל-API כוללת: ?business_id=11111111-1111-1111-1111-111111111111

### ✅ בלי Supabase ב־compose: אין יותר קריאות ל-54321/54322 מהקליינט
1. פתח Developer Tools → Network
2. רענן את הדף וטען עובדים
3. ודא שאין קריאות ל:
   - localhost:54321 (PostgREST)
   - localhost:54322 (PostgreSQL)
   רק קריאות ל-localhost:8084 (FastAPI)

## הגדרות סביבה:

```bash
# app/.env.local
VITE_AUTH_PROVIDER=simple  # simple | supabase  
VITE_API_URL=http://localhost:8084
```

## מעבר ל-Supabase בעתיד:
```bash
# כשנרצה לחזור ל-Supabase
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...
```

## ארכיטקטורת המערכת החדשה:

```
AuthContext (React) 
    ↓
AuthProvider Interface
    ↓
SimpleAuthProvider ← localStorage
SupabaseAuthProvider ← Supabase (עתידי)
```

הכל מנוהל דרך הקונפיג VITE_AUTH_PROVIDER!
