# 🚢 Crown Expo Company — Enterprise Container Logistics & Financial PWA

A full-stack Progressive Web Application built for container logistics tracking, multi-currency client payment ledgers, vendor reviews, shipping logs, and commission management.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-000000?logo=vercel)

---

## 🌐 Live Application
* **Production URL:** [crownexpocompany-nv2l3of8r-ian19-4b1d.vercel.app](https://crownexpocompany-nv2l3of8r-ian19-4b1d.vercel.app)

---

## ✨ Core Features & Functionality

* **Container & Order Tracking:** Real-time logging and monitoring of active container shipments, contract dates, and logistics statuses.
* **Client Payment Ledger:** Financial system managing client deposits, running balances, and multi-stage payment verification.
* **Shipping & Vendor Management:** Logistics tracking, carrier history, vendor quality ratings, and storage integration for Bills of Lading (BoL).
* **Commission Engine:** Automatic calculation and tracking of agent commissions tied directly to order milestones.
* **Multi-Tenant Security:** Powered by Supabase **Row-Level Security (RLS)** ensuring strict, isolated user data access.
* **Executive Dark-Slate UI:** Custom, responsive interface designed using React, Tailwind CSS, and Lucide icons.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Tailwind CSS, Lucide React
* **Backend & Database:** Supabase (PostgreSQL, Row-Level Security, Storage Buckets, Authentication)
* **Hosting & CI/CD:** Vercel Global Edge Network

---

## 🔒 Data Isolation (Supabase RLS Example)

All database operations enforce strict user-level data isolation via PostgreSQL policies:

```sql
CREATE POLICY "Users can manage own container_orders" ON container_orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  