import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ms';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    pos: 'POS',
    inventory: 'Inventory',
    supplies: 'Supplies',
    buySupplies: 'Buy Supplies',
    supplyOrders: 'Supply Orders',
    cashFlow: 'Cash Flow',
    reports: 'Reports',
    support: 'Support',
    settings: 'Settings',
    users: 'Users',
    logout: 'Logout',
    profile: 'Profile',
    welcome: 'Welcome',
    notifications: 'Notifications',
    search: 'Search',
    active: 'Active',
    suspended: 'Suspended',
    admin: 'Admin',
    vendor: 'Vendor',
    supplier: 'Supplier',
    personalId: 'Personal ID',
    studentId: 'Student ID',
    username: 'Username',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    mobileNumber: 'Mobile Number',
    gender: 'Gender',
    residentialAddress: 'Residential Address',
    businessAddress: 'Business Address',
    shippingAddress: 'Shipping Address',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    status: 'Status',
    role: 'Role',
    actions: 'Actions'
  },
  ms: {
    dashboard: 'Papan Pemuka',
    pos: 'POS',
    inventory: 'Inventori',
    supplies: 'Bekalan',
    buySupplies: 'Beli Bekalan',
    supplyOrders: 'Pesanan Bekalan',
    cashFlow: 'Aliran Tunai',
    reports: 'Laporan',
    support: 'Sokongan',
    settings: 'Tetapan',
    users: 'Pengguna',
    logout: 'Log Keluar',
    profile: 'Profil',
    welcome: 'Selamat Datang',
    notifications: 'Notifikasi',
    search: 'Cari',
    active: 'Aktif',
    suspended: 'Digantung',
    admin: 'Admin',
    vendor: 'Vendor',
    supplier: 'Pembekal',
    personalId: 'ID Peribadi',
    studentId: 'ID Pelajar',
    username: 'Nama Pengguna',
    firstName: 'Nama Pertama',
    lastName: 'Nama Akhir',
    email: 'Emel',
    mobileNumber: 'Nombor Telefon',
    gender: 'Jantina',
    residentialAddress: 'Alamat Kediaman',
    businessAddress: 'Alamat Perniagaan',
    shippingAddress: 'Alamat Penghantaran',
    saveChanges: 'Simpan Perubahan',
    cancel: 'Batal',
    edit: 'Edit',
    delete: 'Padam',
    status: 'Status',
    role: 'Peranan',
    actions: 'Tindakan'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLanguage = 'en' }: { children: React.ReactNode, initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  const t = (key: string) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
