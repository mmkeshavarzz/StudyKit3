/**
 * ═══════════════════════════════════════════════════════════════
 * StudyKit — Service Worker
 * مدیریت کش و عملکرد آفلاین
 * 
 * توسعه‌دهنده: محمدمهدی کشاورز
 * نسخه: 1.0.0
 * ═══════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'studykit-cache-v1';
const CACHE_VERSION = 'v1.0.0';

/**
 * لیست فایل‌هایی که باید کش بشن
 * این فایل‌ها وقتی اولین بار سایت لود میشه، دانلود و ذخیره میشن
 */
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    // فونت‌ها و CDN — اینا آنلاین کش میشن
    'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

/* ──────────────────────────────────────────
   رویداد Install — ذخیره فایل‌ها در کش
   ────────────────────────────────────────── */
self.addEventListener('install', (event) => {
    console.log('[StudyKit SW] نصب Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[StudyKit SW] کش کردن فایل‌ها...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // فوری فعال بشه بدون منتظر موندن
                return self.skipWaiting();
            })
            .catch((error) => {
                console.warn('[StudyKit SW] خطا در کش:', error);
            })
    );
});

/* ──────────────────────────────────────────
   رویداد Activate — پاک‌سازی کش‌های قدیمی
   ────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
    console.log('[StudyKit SW] فعال‌سازی Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log(`[StudyKit SW] حذف کش قدیمی: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // بلافاصله کنترل تمام تب‌ها رو بگیره
                return self.clients.claim();
            })
    );
});

/* ──────────────────────────────────────────
   رویداد Fetch — استراتژی: Cache First, Network Fallback
   ────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
    // فقط درخواست‌های GET رو مدیریت کن
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // اگه توی کش بود، از کش برگردون
                if (cachedResponse) {
                    // ولی در پس‌زمینه ورژن جدید رو هم بگیر (stale-while-revalidate)
                    const fetchPromise = fetch(event.request)
                        .then((networkResponse) => {
                            // آپدیت کش با نسخه جدید
                            if (networkResponse && networkResponse.status === 200) {
                                const responseClone = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            // اگه شبکه نبود، مهم نیست — از کش استفاده میکنیم
                        });

                    return cachedResponse;
                }

                // اگه توی کش نبود، از شبکه بگیر
                return fetch(event.request)
                    .then((networkResponse) => {
                        // اگه موفق بود، کش کن برای دفعه بعد
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // اگه آفلاین بود و توی کش هم نبود
                        // یه صفحه آفلاین ساده برگردون
                        if (event.request.destination === 'document') {
                            return new Response(
                                `<!DOCTYPE html>
                                <html lang="fa" dir="rtl">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>آفلاین — استادی‌کیت</title>
                                    <style>
                                        body {
                                            font-family: 'Vazirmatn', sans-serif;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            min-height: 100vh;
                                            background: #F5F0EB;
                                            color: #2D2D2D;
                                            text-align: center;
                                            padding: 2rem;
                                        }
                                        .offline-msg {
                                            max-width: 400px;
                                        }
                                        .offline-msg h1 {
                                            font-size: 3rem;
                                            margin-bottom: 1rem;
                                        }
                                        .offline-msg p {
                                            color: #6B6B6B;
                                            line-height: 1.8;
                                        }
                                        .retry-btn {
                                            margin-top: 1.5rem;
                                            padding: 0.8rem 2rem;
                                            border: none;
                                            border-radius: 12px;
                                            background: linear-gradient(135deg, #A8D8EA, #E8D5F5);
                                            color: white;
                                            font-size: 1rem;
                                            font-weight: 700;
                                            cursor: pointer;
                                            font-family: 'Vazirmatn', sans-serif;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="offline-msg">
                                        <h1>📡</h1>
                                        <h2>اینترنتت قطعه!</h2>
                                        <p>نگران نباش، وصل که شدی همه چی سر جاشه 💪</p>
                                        <button class="retry-btn" onclick="location.reload()">تلاش دوباره</button>
                                    </div>
                                </body>
                                </html>`,
                                {
                                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                                }
                            );
                        }
                    });
            })
    );
});

/* ──────────────────────────────────────────
   رویداد Sync — همگام‌سازی پس‌زمینه
   وقتی اینترنت وصل بشه، داده‌های معلق رو ارسال میکنه
   ────────────────────────────────────────── */
self.addEventListener('sync', (event) => {
    console.log('[StudyKit SW] Background Sync:', event.tag);

    if (event.tag === 'sync-study-data') {
        event.waitUntil(
            // داده‌های ذخیره‌شده آفلاین رو سینک کن
            clients.matchAll().then((allClients) => {
                allClients.forEach((client) => {
                    client.postMessage({
                        type: 'SYNC_COMPLETE',
                        tag: event.tag
                    });
                });
            })
        );
    }
});

/* ──────────────────────────────────────────
   رویداد Periodic Sync — سینک دوره‌ای
   هر چند ساعت یکبار داده‌ها رو آپدیت میکنه
   ────────────────────────────────────────── */
self.addEventListener('periodicsync', (event) => {
    console.log('[StudyKit SW] Periodic Sync:', event.tag);

    if (event.tag === 'update-study-content') {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                // فایل‌های اصلی رو دوباره از سرور بگیر
                return cache.addAll([
                    './',
                    './index.html',
                    './style.css',
                    './app.js'
                ]);
            }).then(() => {
                console.log('[StudyKit SW] محتوا آپدیت شد!');
            }).catch((error) => {
                console.warn('[StudyKit SW] خطا در سینک دوره‌ای:', error);
            })
        );
    }
});

/* ──────────────────────────────────────────
   رویداد Push — دریافت نوتیفیکیشن
   وقتی سرور پیامی بفرسته، اینجا دریافت میشه
   ────────────────────────────────────────── */
self.addEventListener('push', (event) => {
    console.log('[StudyKit SW] Push دریافت شد!');

    // پیام پیش‌فرض اگه دیتایی نبود
    let notificationData = {
        title: '📚 استادی‌کیت',
        body: 'وقت مطالعه‌ست! بیا درست رو بخون 💪',
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png'
    };

    // اگه دیتا داشت، جایگزین کن
    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = { ...notificationData, ...pushData };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            vibrate: [200, 100, 200],
            tag: 'studykit-notification',
            renotify: true,
            data: { url: './' },
            actions: [
                { action: 'open', title: '📖 باز کن' },
                { action: 'close', title: '❌ بعداً' }
            ]
        })
    );
});

/* ──────────────────────────────────────────
   رویداد Notification Click — کلیک روی نوتیفیکیشن
   وقتی کاربر روی نوتیفیکیشن بزنه، سایت باز میشه
   ────────────────────────────────────────── */
self.addEventListener('notificationclick', (event) => {
    console.log('[StudyKit SW] کلیک روی نوتیفیکیشن:', event.action);
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // اگه تب باز داره، فوکوس کن
                for (const client of clientList) {
                    if (client.url.includes('studykit') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // وگرنه تب جدید باز کن
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url || './');
                }
            })
    );
});