# Back-office ERP MVP — Orders, Customer 360, Invoicing, Shipping

از **Invoicing + Payments** شروع می‌کنم (اولویت شما)، ولی چون همه‌ی چهار حوزه به هم وابسته‌اند، **یک migration واحد** برای کل شِما می‌سازم و بعد ماژول‌ها را به ترتیب پیاده می‌کنم. اجرای هر ماژول کاملاً end-to-end است.

## چه چیزی ساخته می‌شود

### ۱. شِمای دیتابیس (یک migration)
جدول‌های جدید در `public` با RLS، GRANT، تریگر `updated_at`، و پالیسی‌های نقش‌محور (`super_admin`/`management`/`sales`/`operations`/`finance`).

```text
orders                — سفارش مشتری (سربرگ)
  status: draft | confirmed | in_production | ready_to_ship | shipped | delivered | cancelled
  customer_id, currency, incoterm, order_date, requested_delivery, total_net/vat/gross, notes
order_items           — خطوط سفارش (product_id, qty, unit_price, discount, line_total)
order_status_history  — تاریخچه تغییر وضعیت با کاربر + timestamp

invoices              — proforma & commercial (نوع: proforma | commercial)
  status: draft | issued | partially_paid | paid | overdue | void
  order_id, customer_id, invoice_number (auto), issue_date, due_date,
  currency, subtotal, vat_amount, total, amount_paid, balance
invoice_items         — خطوط فاکتور
invoice_number_seq    — sequence برای شماره‌گذاری خودکار (INV-2026-000123)

payments              — پرداخت‌های دریافتی
  invoice_id, amount, currency, method (bank/card/cash/lc/other),
  received_at, reference, notes

shipments             — ارسال‌ها
  order_id, status (preparing|in_transit|delivered), carrier, tracking_no,
  incoterm, container_no, bl_number, shipped_at, delivered_at, notes
shipment_items        — نگاشت آیتم‌های ارسال‌شده به order_items

documents             — انبار اسناد پیوست‌شونده
  entity_type (order|invoice|shipment|customer), entity_id,
  kind (proforma_pdf|commercial_pdf|packing_list|bl|coa|other),
  file_path (Supabase Storage), file_name, mime_type, size, uploaded_by
```
یک bucket خصوصی به نام `crm-docs` برای PDF/فایل‌ها ساخته می‌شود.

### ۲. Customer 360 — ماژول اول UI
- صفحه `/admin/customers/$id`: هدر مشتری + KPI (تعداد سفارش، مانده باز، LTV) + تب‌های:
  - **Overview** (اطلاعات + یادداشت‌ها)
  - **Orders** (لیست سفارش‌های همان مشتری با وضعیت)
  - **Invoices** (فاکتورها + وضعیت پرداخت)
  - **Shipments**
  - **Documents**
- لینک از ردیف‌های جدول موجود `admin/customers` به این صفحه.

### ۳. Orders — CRUD + وضعیت
- جایگزینی placeholder فعلی `admin.orders.tsx` با لیست کامل + فیلتر وضعیت/مشتری/تاریخ.
- صفحه‌ی `/admin/orders/$id` با ویرایش خطوط، محاسبه‌ی خودکار جمع/مالیات، دکمه‌ی «تغییر وضعیت» با ثبت در `order_status_history`.
- اکشن‌های سریع: **Generate Proforma**, **Generate Invoice**, **Create Shipment**.

### ۴. Invoicing + Payments (اولویت اول شما)
- جایگزینی `admin.proforma-invoices.tsx` و `admin.invoices.tsx` با لیست‌های واقعی + فیلتر وضعیت/تاریخ/مشتری.
- صفحه‌ی جزئیات فاکتور با خطوط، وضعیت پرداخت، Timeline پرداخت‌ها.
- **تولید PDF** (سرور فانکشن با `pdfkit` یا React-PDF مشابه cv-confirmation-pdf.ts موجود) و آپلود در bucket `crm-docs`، ثبت در `documents`.
- ثبت پرداخت با فرم: مبلغ، تاریخ، روش، مرجع → به‌روزرسانی `amount_paid` و `status` (partial/paid).
- شماره‌گذاری خودکار: `PRO-2026-XXXX` و `INV-2026-XXXX` از sequence.

### ۵. Shipping + Documents
- صفحه‌ی `/admin/shipments` و جزئیات با آپلود Packing List / BOL / COA.
- در صفحه‌ی سفارش، تب Documents برای مشاهده/آپلود دستی.
- Signed URL برای دانلود، دسترسی محدود به کاربران احراز شده.

## نقش‌ها و دسترسی
- `super_admin`, `management`: همه چیز
- `sales`: مشاهده و ویرایش orders/customers، فقط مشاهده invoice/payment/shipment
- `operations`: orders/shipments/documents، فقط مشاهده invoice
- `finance`: invoices/payments، فقط مشاهده orders/shipments
- `read_only`: فقط مشاهده

هم در RLS و هم در `crm-permissions.ts` اعمال می‌شود.

## چیزی که در این پلن **نیست** (می‌تونیم بعداً اضافه کنیم)
- درگاه پرداخت واقعی (Stripe/Paddle) — الان فقط ثبت دستی پرداخت
- Purchase Orders / Suppliers side (خرید از تأمین‌کننده) — الان placeholder می‌ماند
- ماژول انبار/موجودی (stock levels, lot tracking)
- ایمیل خودکار فاکتور به مشتری (زیرساخت ایمیل branded آماده‌ست، در فاز بعد وصل می‌کنم)
- گزارش‌های مالی پیشرفته (aging, cashflow) — یک KPI ساده در dashboard اضافه می‌شود

## ترتیب اجرا
۱. Migration کامل schema + RLS + storage bucket → منتظر تایید شما
۲. Customer 360 (چون همه‌ی ماژول‌ها به آن لینک می‌دهند)
۳. Orders (CRUD + status flow)
۴. Invoices + Payments + PDF
۵. Shipments + Documents

بعد از هر مرحله preview قابل تست است.

## جزئیات فنی
- همه‌ی جدول‌ها: `id uuid pk`, `created_at`, `updated_at`, `created_by`, `updated_by`, تریگر `set_updated_at` و `stamp_updated_by` (موجود).
- تریگر `log_row_delete` روی جدول‌های حساس (invoices, payments, orders).
- Sequence با تابع SECURITY DEFINER برای شماره‌گذاری thread-safe.
- Storage bucket `crm-docs` private + پالیسی خواندن/نوشتن برای نقش‌های مجاز از طریق server function با signed URL.
- تمام queryها از طریق کلاینت مرورگر با RLS انجام می‌شوند (بدون service role).
- PDFها با همان الگوی `src/lib/cv-confirmation-pdf.ts` (React-PDF) در server function.

آماده‌ام شروع کنم. تأیید می‌کنی migration رو بسازم؟