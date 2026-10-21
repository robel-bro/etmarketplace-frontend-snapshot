// src/pages/partner/PartnerBoardPage.tsx
import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon, MapPinIcon, CurrencyDollarIcon, ScaleIcon, ArrowPathIcon,
  CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon,
  BuildingOffice2Icon, PowerIcon,
  Squares2X2Icon, ClipboardDocumentListIcon, CubeIcon,
  FunnelIcon, DocumentTextIcon,
  ArrowRightIcon, ShieldCheckIcon,
  ArrowUturnLeftIcon, PencilSquareIcon, TrashIcon,
  PlusIcon, XMarkIcon, PhoneIcon, EyeIcon, BanknotesIcon, UsersIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { initCable, subscribeToPartnerBoard } from '../../lib/cable';
import { formatCurrency, formatTimeAgo, truncateText } from '../../lib/format';

/* ============================== */
/*   Translation System          */
/* ============================== */
type Language = 'en' | 'am';
interface TranslationContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}
const TranslationContext = createContext<TranslationContextProps>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});
const useTranslation = () => useContext(TranslationContext);

const translations: Record<Language, Record<string, string>> = {
  en: {
    terminalAccess: 'Terminal Access',
    dispatchGateway: 'Dispatch Gateway',
    corporatePhone: 'Corporate Phone',
    password: 'Password',
    signIn: 'Sign In',
    authenticating: 'Authenticating…',
    enterTerminal: 'Enter Terminal',
    largestMarketplace: "Ethiopia's Largest Marketplace",
    partnerEdition: 'Partner Ed.',
    accountNotLinked: 'Account Not Linked',
    accountNotLinkedDesc: "This login isn't attached to an active logistics company yet. Contact administrative support to complete linking.",
    signOut: 'Sign Out',
    deliveryPartnersPortal: 'Delivery Partners Portal',
    shopStatus: 'Shop Status',
    online: 'Online',
    offline: 'Offline',
    onlineStatusUpdated: 'Online status updated successfully.',
    dispatchAccepted: 'Dispatch accepted! Shifted to Active Services.',
    failedAccept: 'Failed to accept request.',
    statusUpdated: 'Delivery status updated.',
    statusUpdateFailed: 'Status update failed.',
    authFailed: 'Authentication failed',
    deliveryBoard: 'Delivery Board',
    activeServices: 'Active Services',
    myFleet: 'My Fleet',
    rateCards: 'Rate Cards',
    companyProfile: 'Company Profile',
    financials: 'Financials',
    drivers: 'Drivers',
    goOnline: 'Go Online',
    goOffline: 'Go Offline',
    partnerID: 'Partner ID',
    liveFeed: 'Live Feed · Updates in Real Time',
    dispatchBoard: 'Dispatch Board',
    dispatchBoardSub: 'Open requests from the marketplace, matched against what your fleet can carry right now.',
    openRequests: 'Open Requests',
    readyUnits: 'Ready Units',
    boardValue: 'Board Value',
    terminal: 'Terminal',
    live: 'live',
    available: 'Available',
    broadcasting: 'Broadcasting',
    offlineMode: 'Offline Mode',
    searchPlaceholder: 'Search origin, destination, or order ID…',
    allVehicles: 'All Vehicles',
    vehicleType: 'Vehicle Type',
    motorcycle: 'Motorcycle',
    car: 'Car',
    van: 'Van',
    truck: 'Truck',
    weightRange: 'Weight (KG)',
    minWeight: 'Min',
    maxWeight: 'Max',
    cashOnDelivery: 'Cash on Delivery',
    minCash: 'Min Cash',
    maxCash: 'Max Cash',
    filters: 'Filters',
    clear: 'Clear',
    requiresFragile: 'Requires Fragile Handling',
    requiresTempControl: 'Requires Temperature Control',
    boardClear: 'Board is clear',
    boardClearSub: 'Adjust your filters, or check back — new requests post here the moment they\'re placed.',
    noActiveDispatches: 'No active service contracts',
    noActiveSub: 'Accept open orders from the Live Delivery Board to initialize fulfillment.',
    noVehicles: 'No Registered Fleet Assets',
    noVehiclesSub: 'Register vehicle units to enable accepting jobs from the Delivery Board.',
    noDrivers: 'No Registered Drivers',
    noDriversSub: 'Add drivers to assign them to deliveries.',
    addDriver: 'Add Driver',
    editDriver: 'Edit Driver',
    driverName: 'Full Name',
    driverPhone: 'Phone',
    licenseNumber: 'License Number',
    address: 'Address',
    photo: 'Driver Photo',
    licensePhoto: 'License Photo',
    noRates: 'Rates Not Configured',
    noRatesSub: 'Platform rates are currently being synced.',
    estPayout: 'Est. Payout',
    pickupOrigin: 'Pickup Origin',
    deliveryDestination: 'Delivery Destination',
    pickupPointBuyer: 'Pickup Point (Buyer)',
    dropoffPointSellerReturn: 'Dropoff Point (Seller Return)',
    itemPackage: 'Item Package',
    grossPayload: 'Gross Payload',
    cashCollection: 'Cash Collection',
    assignUnit: 'Assign Unit',
    selectFleetVehicle: 'Select fleet vehicle...',
    selectDriver: 'Select driver...',
    acceptJob: 'Accept Job',
    processing: 'Processing...',
    codTag: 'COD',
    returnTag: 'Return',
    returnOrder: 'Return Order',
    activeDispatches: 'Active Dispatches',
    activeSub: 'active delivery operations undergoing execution.',
    job: 'Job',
    assignedVehicle: 'Assigned Vehicle',
    assignedDriver: 'Assigned Driver',
    collectCOD: 'Collect COD',
    pickupOriginSeller: 'Pickup Origin (Seller)',
    destinationBuyer: 'Destination Point (Buyer)',
    returnPointSeller: 'Return Point (Seller)',
    call: 'Call',
    confirmPickup: 'Confirm Pickup at Seller',
    markPickedUp: 'Mark Order Picked Up',
    markInTransit: 'Mark In Transit',
    confirmDeliveryComplete: 'Confirm Delivery Complete',
    fleetAssetControl: 'Fleet Asset Control',
    fleetSub: 'Manage registered dispatch units, license plates, and vehicle capacities.',
    registerNewUnit: 'Register New Unit',
    payloadLimit: 'Payload Limit',
    edit: 'Edit',
    vehicleClassification: 'Vehicle Classification',
    licensePlateNumber: 'License Plate Number',
    maxCapacityPayload: 'Maximum Capacity Payload (KG)',
    primaryDriverName: 'Primary Driver Name (Optional)',
    driverPhone: 'Driver Phone (Optional)',
    cancel: 'Cancel',
    saveUnit: 'Save Unit',
    saving: 'Saving...',
    addVehicle: 'Add Vehicle Unit',
    editVehicle: 'Edit Vehicle Unit',
    compensationRates: 'Compensation Rates',
    ratesSub: 'Platform standardized distance and base tariffs per asset category.',
    liveEarningsSimulator: 'Live Earnings Simulator',
    selectCategory: 'Select Category',
    tripDistance: 'Trip Distance (KM)',
    estimatedTariff: 'Estimated Tariff',
    baseFare: 'Base Fare',
    perKm: 'Per KM',
    minGuarantee: 'Minimum Fare Guarantee',
    institutionalProfile: 'Institutional Profile & Settlement',
    profileSub: 'Manage partner verification documents, corporate details, and settlement accounts.',
    verifiedEnterprise: 'Verified Logistics Enterprise',
    verifiedDesc: 'Your tax registration and business operating permits are active.',
    activeTerminal: 'Active Terminal',
    corporateIdentity: 'Corporate Identity',
    companyRegisteredName: 'Company Registered Name',
    dispatchPhoneLine: 'Dispatch Phone Line',
    tinNumber: 'TIN Tax Identification Number',
    operatingRegion: 'Operating Region',
    settlementBanking: 'Settlement & Banking Info',
    commercialBankName: 'Commercial Bank Name',
    settlementAccount: 'Settlement Account Number',
    complianceCredentials: 'Compliance Credentials',
    businessLicense: 'Business License',
    tinRegistration: 'TIN Registration',
    fleetInsurancePolicy: 'Fleet Insurance Policy',
    reviewDocument: 'Review Document',
    notUploaded: 'Not Uploaded',
    driverVerification: 'Driver Verification',
    showFulfilled: 'Show Fulfilled',
    showActive: 'Show Active',
    allStatus: 'All Status',
    volume: 'Max Volume',
    refrigerated: 'Refrigerated',
    fragileCapable: 'Fragile Capable',
    yes: 'Yes',
    no: 'No',
    availableCount: 'Available',
    items: 'Items',
    pendingPayout: 'Pending Payout',
    paidPayout: 'Paid Payout',
    codOwed: 'COD Owed',
    netBalance: 'Net Balance',
    weOweYou: 'We owe you',
    youOwePlatform: 'You owe platform',
    alreadySettled: 'Already settled',
    transactionHistory: 'Transaction History',
    type: 'Type',
    description: 'Description',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    noTransactions: 'No transactions',
  },
  am: {
    terminalAccess: 'የተርሚናል መግቢያ',
    dispatchGateway: 'የመላኪያ መግቢያ',
    corporatePhone: 'የድርጅት ስልክ',
    password: 'የይለፍ ቃል',
    signIn: 'ግባ',
    authenticating: 'በመረጋገጥ ላይ…',
    enterTerminal: 'ወደ ተርሚናል ግባ',
    largestMarketplace: 'የኢትዮጵያ ትልቁ የገበያ ቦታ',
    partnerEdition: 'የአጋር እትም',
    accountNotLinked: 'መለያ አልተገናኘም',
    accountNotLinkedDesc: 'ይህ መግቢያ ከንቁ የሎጂስቲክስ ኩባንያ ጋር አልተገናኘም። ለማገናኘት እባክዎ የአስተዳደር ድጋፍን ያነጋግሩ።',
    signOut: 'ውጣ',
    deliveryPartnersPortal: 'የመላኪያ አጋሮች ፖርታል',
    shopStatus: 'የሱቅ ሁኔታ',
    online: 'በመስመር ላይ',
    offline: 'ከመስመር ውጭ',
    onlineStatusUpdated: 'የመስመር ላይ ሁኔታ በተሳካ ሁኔታ ተዘምኗል።',
    dispatchAccepted: 'መላኪያ ተቀባይነት አግኝቷል! ወደ ንቁ አገልግሎቶች ተዛውሯል።',
    failedAccept: 'ጥያቄውን መቀበል አልተሳካም።',
    statusUpdated: 'የመላኪያ ሁኔታ ተዘምኗል።',
    statusUpdateFailed: 'ሁኔታ መዘመን አልተሳካም።',
    authFailed: 'ማረጋገጥ አልተሳካም',
    deliveryBoard: 'የመላኪያ ሰሌዳ',
    activeServices: 'ንቁ አገልግሎቶች',
    myFleet: 'የእኔ መኪኖች',
    rateCards: 'የዋጋ ካርዶች',
    companyProfile: 'የኩባንያ መገለጫ',
    financials: 'ፋይናንስ',
    drivers: 'አሽከርካሪዎች',
    goOnline: 'በመስመር ላይ ሁን',
    goOffline: 'ከመስመር ውጭ ሁን',
    partnerID: 'የአጋር መታወቂያ',
    liveFeed: 'ቀጥታ ምግብ · በቅጽበት የሚዘመን',
    dispatchBoard: 'የመላኪያ ሰሌዳ',
    dispatchBoardSub: 'ከገበያው የሚመጡ ክፍት ጥያቄዎች፣ ከመኪናዎ አቅም ጋር የተጣጣሙ።',
    openRequests: 'ክፍት ጥያቄዎች',
    readyUnits: 'ዝግጁ ክፍሎች',
    boardValue: 'የሰሌዳ ዋጋ',
    terminal: 'ተርሚናል',
    live: 'ቀጥታ',
    available: 'ይገኛል',
    broadcasting: 'ስርጭት',
    offlineMode: 'ከመስመር ውጭ',
    searchPlaceholder: 'መነሻ፣ መድረሻ ወይም የትዕዛዝ መታወቂያ ይፈልጉ…',
    allVehicles: 'ሁሉም ተሽከርካሪዎች',
    vehicleType: 'የተሽከርካሪ አይነት',
    motorcycle: 'ሞተርሳይክል',
    car: 'መኪና',
    van: 'ቫን',
    truck: 'ከባድ መኪና',
    weightRange: 'ክብደት (ኪ.ግ.)',
    minWeight: 'ዝቅተኛ',
    maxWeight: 'ከፍተኛ',
    cashOnDelivery: 'በመላኪያ ጊዜ ጥሬ ገንዘብ',
    minCash: 'ዝቅተኛ ገንዘብ',
    maxCash: 'ከፍተኛ ገንዘብ',
    filters: 'ማጣሪያዎች',
    clear: 'አጽዳ',
    requiresFragile: 'የተሰባሪ አያያዝ ያስፈልጋል',
    requiresTempControl: 'የሙቀት መቆጣጠሪያ ያስፈልጋል',
    boardClear: 'ሰሌዳው ባዶ ነው',
    boardClearSub: 'ማጣሪያዎችን ያስተካክሉ፣ ወይም ቆይተው ይመለሱ — አዲስ ጥያቄዎች እንደተለጠፉ እዚህ ይታያሉ።',
    noActiveDispatches: 'ምንም ንቁ አገልግሎት የለም',
    noActiveSub: 'ከቀጥታ የመላኪያ ሰሌዳ ክፍት ትዕዛዞችን ይቀበሉ።',
    noVehicles: 'የተመዘገቡ ተሽከርካሪዎች የሉም',
    noVehiclesSub: 'ከሰሌዳው ስራዎችን ለመቀበል ተሽከርካሪ ይመዝግቡ።',
    noDrivers: 'የተመዘገቡ አሽከርካሪዎች የሉም',
    noDriversSub: 'መላኪያ ስራዎችን ለመስጠት አሽከርካሪዎችን ይጨምሩ።',
    addDriver: 'አሽከርካሪ ጨምር',
    editDriver: 'አሽከርካሪ አስተካክል',
    driverName: 'ሙሉ ስም',
    driverPhone: 'ስልክ',
    licenseNumber: 'የፍቃድ ቁጥር',
    address: 'አድራሻ',
    photo: 'የአሽከርካሪ ፎቶ',
    licensePhoto: 'የፍቃድ ፎቶ',
    noRates: 'ዋጋዎች አልተዋቀሩም',
    noRatesSub: 'የመድረክ ዋጋዎች በመመሳሰል ላይ ናቸው።',
    estPayout: 'የተገመተ ክፍያ',
    pickupOrigin: 'የመነሻ ቦታ',
    deliveryDestination: 'የመድረሻ ቦታ',
    pickupPointBuyer: 'የመልቀሚያ ቦታ (ገዢ)',
    dropoffPointSellerReturn: 'የመመለሻ ቦታ (ሻጭ)',
    itemPackage: 'የእቃ ጥቅል',
    grossPayload: 'ጠቅላላ ክብደት',
    cashCollection: 'የገንዘብ መሰብሰብ',
    assignUnit: 'ክፍል ይመድቡ',
    selectFleetVehicle: 'ተሽከርካሪ ይምረጡ...',
    selectDriver: 'አሽከርካሪ ይምረጡ...',
    acceptJob: 'ስራ ተቀበል',
    processing: 'በሂደት ላይ...',
    codTag: 'COD',
    returnTag: 'መመለስ',
    returnOrder: 'የመመለሻ ትዕዛዝ',
    activeDispatches: 'ንቁ ስራዎች',
    activeSub: 'በአሁኑ ጊዜ በአፈጻጸም ላይ ያሉ የመላኪያ ስራዎች።',
    job: 'ስራ',
    assignedVehicle: 'የተመደበ ተሽከርካሪ',
    assignedDriver: 'የተመደበ አሽከርካሪ',
    collectCOD: 'COD ይሰብስቡ',
    pickupOriginSeller: 'የመነሻ ቦታ (ሻጭ)',
    destinationBuyer: 'የመድረሻ ቦታ (ገዢ)',
    returnPointSeller: 'የመመለሻ ቦታ (ሻጭ)',
    call: 'ደውል',
    confirmPickup: 'በሻጭ ቦታ መልቀም ያረጋግጡ',
    markPickedUp: 'ትዕዛዝ ተለቅሟል ብለው ምልክት ያድርጉ',
    markInTransit: 'በመጓጓዝ ላይ ነው ብለው ምልክት ያድርጉ',
    confirmDeliveryComplete: 'መላኪያ መጠናቀቁን ያረጋግጡ',
    fleetAssetControl: 'የተሽከርካሪ ንብረት ቁጥጥር',
    fleetSub: 'የተመዘገቡ ተሽከርካሪዎችን፣ ሰሌዳ ቁጥሮችን እና አቅምን ያስተዳድሩ።',
    registerNewUnit: 'አዲስ ክፍል ይመዝግቡ',
    payloadLimit: 'የመጫኛ ገደብ',
    edit: 'አስተካክል',
    vehicleClassification: 'የተሽከርካሪ ምድብ',
    licensePlateNumber: 'የሰሌዳ ቁጥር',
    maxCapacityPayload: 'ከፍተኛ የመጫኛ አቅም (ኪ.ግ.)',
    primaryDriverName: 'ዋና ሹፌር ስም (አማራጭ)',
    driverPhone: 'የሹፌር ስልክ (አማራጭ)',
    cancel: 'ይቅር',
    saveUnit: 'ክፍል አስቀምጥ',
    saving: 'በማስቀመጥ ላይ...',
    addVehicle: 'ተሽከርካሪ ጨምር',
    editVehicle: 'ተሽከርካሪ አስተካክል',
    compensationRates: 'የማካካሻ ዋጋዎች',
    ratesSub: 'በመድረኩ የተደነገጉ የርቀት እና የመሠረት ዋጋዎች ለእያንዳንዱ ተሽከርካሪ ምድብ።',
    liveEarningsSimulator: 'የቀጥታ ገቢ አስመሳይ',
    selectCategory: 'ምድብ ይምረጡ',
    tripDistance: 'የጉዞ ርቀት (ኪ.ሜ)',
    estimatedTariff: 'የተገመተ ዋጋ',
    baseFare: 'የመሠረት ዋጋ',
    perKm: 'በኪ.ሜ',
    minGuarantee: 'ዝቅተኛ ዋስትና',
    institutionalProfile: 'ተቋማዊ መገለጫ እና ሰፈራ',
    profileSub: 'የአጋር ማረጋገጫ ሰነዶችን፣ የድርጅት ዝርዝሮችን እና የመቋቋሚያ ሂሳቦችን ያስተዳድሩ።',
    verifiedEnterprise: 'የተረጋገጠ የሎጂስቲክስ ድርጅት',
    verifiedDesc: 'የግብር ምዝገባዎ እና የንግድ ፈቃዶችዎ ንቁ ናቸው።',
    activeTerminal: 'ንቁ ተርሚናል',
    corporateIdentity: 'የድርጅት ማንነት',
    companyRegisteredName: 'የተመዘገበ የኩባንያ ስም',
    dispatchPhoneLine: 'የስልክ መስመር',
    tinNumber: 'የግብር ከፋይ መለያ ቁጥር (TIN)',
    operatingRegion: 'የስራ ክልል',
    settlementBanking: 'ሰፈራ እና ባንክ',
    commercialBankName: 'የንግድ ባንክ ስም',
    settlementAccount: 'የመቋቋሚያ ሂሳብ ቁጥር',
    complianceCredentials: 'የማሟሟያ ሰነዶች',
    businessLicense: 'የንግድ ፈቃድ',
    tinRegistration: 'የTIN ምዝገባ',
    fleetInsurancePolicy: 'የመኪና ኢንሹራንስ ፖሊሲ',
    reviewDocument: 'ሰነድ ይገምግሙ',
    notUploaded: 'አልተጫነም',
    driverVerification: 'የአሽከርካሪ ማረጋገጫ',
    showFulfilled: 'የተጠናቀቁ አሳይ',
    showActive: 'ንቁ አሳይ',
    allStatus: 'ሁሉም ሁኔታ',
    volume: 'ከፍተኛ መጠን',
    refrigerated: 'ማቀዝቀዣ',
    fragileCapable: 'ስብራት የሚችል',
    yes: 'አዎ',
    no: 'አይ',
    availableCount: 'ዝግጁ',
    items: 'ዕቃዎች',
    pendingPayout: 'የሚከፈል ክፍያ',
    paidPayout: 'የተከፈለ ክፍያ',
    codOwed: 'COD ዕዳ',
    netBalance: 'የተጣራ ቀሪ ሂሳብ',
    weOweYou: 'እኛ እንከፍልዎታለን',
    youOwePlatform: 'እርስዎ ዕዳ አለብዎት',
    alreadySettled: 'ተረጋግቷል',
    transactionHistory: 'የግብይቶች ታሪክ',
    type: 'ዓይነት',
    description: 'መግለጫ',
    date: 'ቀን',
    amount: 'መጠን',
    status: 'ሁኔታ',
    noTransactions: 'ምንም ግብይቶች የሉም',
  },
};

/* ============================== */
/*   Vehicle Icons               */
/* ============================== */
const MotorcycleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="16" r="3" />
    <circle cx="19" cy="16" r="3" />
    <path d="M8 14h4l3-5h3" />
    <path d="M5 14h2l1-3h3" />
    <path d="M15 7h2l3 4" />
  </svg>
);
const CarIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 11l1.5-5h11L19 11" />
    <path d="M3 16v2h2v-2M19 16v2h2v-2" />
    <circle cx="7" cy="16" r="1" />
    <circle cx="17" cy="16" r="1" />
    <path d="M3 11h18" />
    <path d="M5 11h14" />
  </svg>
);
const VanIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10v8H3z" />
    <path d="M13 8l5 3v5h-5" />
    <circle cx="6" cy="18" r="1" />
    <circle cx="17" cy="18" r="1" />
    <path d="M13 11h5" />
  </svg>
);
const TruckIconReal = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h11v8H3z" />
    <path d="M14 10h5l2 3v2h-7" />
    <circle cx="7" cy="17" r="1" />
    <circle cx="17" cy="17" r="1" />
    <path d="M3 15h11" />
  </svg>
);
const VehicleTypeIcon = ({ type, className = 'w-5 h-5' }: { type: string; className?: string }) => {
  switch (type.toLowerCase()) {
    case 'motorcycle': return <MotorcycleIcon className={className} />;
    case 'car': return <CarIcon className={className} />;
    case 'van': return <VanIcon className={className} />;
    case 'truck': return <TruckIconReal className={className} />;
    default: return <CubeIcon className={className} />;
  }
};

/* ============================== */
/*   Styles                      */
/* ============================== */
const inputClass = 'w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white text-[#111] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-150 shadow-sm';
const cardClass = 'bg-white/60 backdrop-blur-lg rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200';
const labelClass = 'block text-[11px] font-bold text-[#111] uppercase tracking-wider mb-1.5';

/* ============================== */
/*   Types                       */
/* ============================== */
interface PartnerProfile {
  id: number; name: string; phone: string; email?: string; tin?: string;
  status: string; online: boolean; logo_url?: string; business_license_url?: string;
  tin_url?: string; insurance_url?: string; bank_name?: string; account_number?: string;
  telebirr_number?: string; operating_region?: string; verified?: boolean;
}
interface DeliveryRequest {
  id: number; pickup_address: string; delivery_address: string; required_vehicle_type: string;
  package_details: { weight_kg: number; volume_cm3?: number; chargeable_weight_kg?: number; refrigerated?: boolean; fragile?: boolean; return_reason?: string };
  cod_amount: number | null; estimated_earnings: number; status: string; logistics_partner_id?: number;
  payment_method?: string;
  products?: { title: string; quantity: number; weight_kg: number; price: number; image_url?: string; variant_attributes?: Record<string, string> }[];
  is_return?: boolean; return_reason?: string; distance_km?: number;
  can_accept?: boolean; created_at?: string;
}
interface ActiveDelivery {
  id: number; status: string; pickup_address: string; delivery_address: string;
  cod_amount: number | null; payment_method: string;
  seller?: { name: string; phone: string };
  buyer?: { name: string; phone: string };
  products: { title: string; quantity: number; weight_kg: number; price: number; image_url?: string }[];
  vehicle?: { id: number; plate_number: string; vehicle_type: string };
  driver?: { id: number; name: string; phone: string; photo_url?: string };
  accepted_at: string; pickup_confirmed_at?: string; picked_up_at?: string; delivered_at?: string;
  is_return?: boolean; return_reason?: string;
}
interface Vehicle {
  id: number; vehicle_type: string; plate_number: string;
  max_weight_kg: number;
  max_volume_cm3?: number | null;
  refrigerated?: boolean;
  fragile_capable?: boolean;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  status: 'available' | 'busy' | 'maintenance';
  driver_name?: string;
  driver_phone?: string;
}
interface Driver {
  id: number;
  name: string;
  phone: string;
  license_number?: string;
  address?: string;
  photo_url?: string;
  license_photo_url?: string;
  status: 'available' | 'on_delivery' | 'inactive';
}
interface RateCard { id: number; vehicle_type: string; base_rate: number; per_km_rate: number; min_charge: number; }

/* ============================== */
/*   Image URL Resolver          */
/* ============================== */
const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = api.defaults.baseURL || '';
  return `${base}${url}`;
};

/* ============================== */
/*   Main Page Component         */
/* ============================== */
export default function PartnerBoardPage() {
  const { user, login, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<Language>('en');
  const t = (key: string) => translations[lang][key] || key;

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const partnerId = user?.logistics_partner?.id;
  const [nav, setNav] = useState<'board' | 'active' | 'fleet' | 'drivers' | 'rates' | 'profile' | 'financials'>('board');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);

  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [fulfillableOnly, setFulfillableOnly] = useState(false);
  const [acceptingRequestId, setAcceptingRequestId] = useState<number | null>(null);
  const [selectedVehicleMap, setSelectedVehicleMap] = useState<Record<number, number>>({});
  const [selectedDriverMap, setSelectedDriverMap] = useState<Record<number, number>>({});

  const [showFulfilled, setShowFulfilled] = useState(false);
  const [fleetFilterType, setFleetFilterType] = useState('all');
  const [fleetFilterStatus, setFleetFilterStatus] = useState('all');

  const { data: profile } = useQuery<PartnerProfile>(['partnerProfile', partnerId], () => api.get('/api/v1/partner/profile').then(r => r.data), { enabled: !!partnerId });
  const { data: vehicles = [] } = useQuery<Vehicle[]>(['partnerVehicles'], () => api.get('/api/v1/partner/vehicles').then(r => r.data), { enabled: !!partnerId });
  const { data: drivers = [] } = useQuery<Driver[]>(['partnerDrivers'], () => api.get('/api/v1/partner/drivers').then(r => r.data), { enabled: !!partnerId });
  const { data: rateCards = [] } = useQuery<RateCard[]>(['partnerRateCards'], () => api.get('/api/v1/partner/rate_cards').then(r => r.data), { enabled: !!partnerId });
  const { data: activeDeliveries = [] } = useQuery<ActiveDelivery[]>(['partnerActiveDeliveries'], () => api.get('/api/v1/partner/active_deliveries').then(r => r.data.data), { enabled: !!partnerId });
  const { data: financials, isLoading: financialsLoading } = useQuery(
    ['partnerFinancials', partnerId],
    () => api.get('/api/v1/partner/financials').then(r => r.data),
    { enabled: !!partnerId }
  );

  const { data: boardRequests = [], isLoading: boardLoading } = useQuery<DeliveryRequest[]>(
    ['partnerBoard', search, vehicleType, fulfillableOnly],
    () => api.get('/api/v1/partner_board', {
      params: { search, vehicle_type: vehicleType, fulfillable_only: fulfillableOnly }
    }).then(r => r.data),
    { enabled: !!partnerId }
  );

  // Sort board requests: eligible (can_accept) first, then newest first
  const sortedBoardRequests = useMemo(() => {
    return [...boardRequests].sort((a, b) => {
      if (a.can_accept !== b.can_accept) return b.can_accept ? 1 : -1;
      const aTime = a.created_at ? new Date(a.created_at).getTime() : a.id;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : b.id;
      return bTime - aTime;
    });
  }, [boardRequests]);

  const visibleActiveDeliveries = useMemo(() => {
    let list = showFulfilled
      ? activeDeliveries.filter(d => ['delivered', 'completed'].includes(d.status))
      : activeDeliveries.filter(d => !['delivered', 'completed', 'cancelled'].includes(d.status));
    list.sort((a, b) => {
      const aTime = a.accepted_at ? new Date(a.accepted_at).getTime() : a.id;
      const bTime = b.accepted_at ? new Date(b.accepted_at).getTime() : b.id;
      return bTime - aTime;
    });
    return list;
  }, [activeDeliveries, showFulfilled]);

  const fleetGrouped = useMemo(() => {
    const groups: Record<string, { total: number; available: number }> = {};
    vehicles.forEach(v => {
      const type = v.vehicle_type;
      groups[type] = groups[type] || { total: 0, available: 0 };
      groups[type].total += 1;
      if (v.status === 'available') groups[type].available += 1;
    });
    return groups;
  }, [vehicles]);

  const filteredFleet = useMemo(() => {
    return vehicles.filter(v => {
      const typeMatch = fleetFilterType === 'all' || v.vehicle_type === fleetFilterType;
      const statusMatch = fleetFilterStatus === 'all' || v.status === fleetFilterStatus;
      return typeMatch && statusMatch;
    });
  }, [vehicles, fleetFilterType, fleetFilterStatus]);

  const toggleOnline = useMutation(() => api.patch('/api/v1/partner/toggle_online'), {
    onSuccess: () => { queryClient.invalidateQueries('partnerProfile'); setNotification({ type: 'success', message: t('onlineStatusUpdated') }); },
  });

  const acceptMutation = useMutation(
    ({ requestId, vehicleId, driverId }: { requestId: number; vehicleId: number; driverId: number }) =>
      api.post(`/api/v1/partner_board/${requestId}/accept`, { vehicle_id: vehicleId, driver_id: driverId }),
    {
      onMutate: ({ requestId }) => setAcceptingRequestId(requestId),
      onSuccess: () => {
        queryClient.invalidateQueries('partnerBoard');
        queryClient.invalidateQueries('partnerVehicles');
        queryClient.invalidateQueries('partnerDrivers');
        setNotification({ type: 'success', message: t('dispatchAccepted') });
      },
      onError: (err: any) => {
        setNotification({ type: 'error', message: err?.response?.data?.error || t('failedAccept') });
      },
      onSettled: () => setAcceptingRequestId(null),
    }
  );

  const updateStatusMutation = useMutation(
    ({ deliveryId, status }: { deliveryId: number; status: string }) =>
      api.patch(`/api/v1/partner/active_deliveries/${deliveryId}/update_status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('partnerActiveDeliveries');
        queryClient.invalidateQueries('partnerVehicles');
        queryClient.invalidateQueries('partnerDrivers');
        setNotification({ type: 'success', message: t('statusUpdated') });
      },
      onError: (err: any) => {
        setNotification({ type: 'error', message: err?.response?.data?.error || t('statusUpdateFailed') });
      }
    }
  );

  const handlePartnerLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError('');
    try { setLoginLoading(true); await login(loginPhone, loginPassword); }
    catch (err: any) { setLoginError(err?.response?.data?.error || t('authFailed')); }
    finally { setLoginLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('access_token');
      if (token) initCable(token);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!partnerId) return;
    const subscription = subscribeToPartnerBoard({
      received: (data) => {
        if (data.type === 'new_delivery_request') queryClient.invalidateQueries('partnerBoard');
      },
    });
    return () => { if (subscription) subscription.unsubscribe(); };
  }, [partnerId, queryClient]);

  if (!isAuthenticated) {
    return (
      <TranslationContext.Provider value={{ lang, setLang, t }}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm">
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-md bg-orange-50 flex items-center justify-center mb-4 border border-orange-200">
                  <TruckIcon className="w-7 h-7 text-orange-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('dispatchGateway')}</h1>
                <p className="text-xs text-gray-500 mt-1">{t('largestMarketplace')}</p>
              </div>
              <form onSubmit={handlePartnerLogin} className="space-y-5">
                <div>
                  <label className={labelClass}>{t('corporatePhone')}</label>
                  <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="+2519..." className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>{t('password')}</label>
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={inputClass} required />
                </div>
                {loginError && <p className="text-red-600 text-sm font-medium">{loginError}</p>}
                <button type="submit" disabled={loginLoading} className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-md transition-colors disabled:opacity-60 shadow-sm">
                  {loginLoading ? t('authenticating') : t('signIn')}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </TranslationContext.Provider>
    );
  }

  if (!partnerId) {
    return (
      <TranslationContext.Provider value={{ lang, setLang, t }}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-8 text-center max-w-md">
            <BuildingOffice2Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900">{t('accountNotLinked')}</h2>
            <p className="text-gray-500 text-sm mt-2">{t('accountNotLinkedDesc')}</p>
            <button onClick={logout} className="mt-6 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">{t('signOut')}</button>
          </div>
        </div>
      </TranslationContext.Provider>
    );
  }

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col font-sans overflow-hidden">
        {/* Glassmorphic Header */}
        <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-lg border-b border-white/40 shadow-sm">
          <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center">
                <img src="/images/logo.png" className="h-10 w-auto" alt="ET Marketplace" onError={(e) => { (e.target as any).style.display='none'; }} />
              </Link>
              <div className="hidden sm:block border-l border-gray-300/50 pl-4 ml-1">
                <p className="text-base font-semibold text-gray-900">{t('deliveryPartnersPortal')}</p>
                <p className="text-xs text-gray-500">{t('largestMarketplace')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/verify-delivery"
                className="text-xs font-medium text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-1"
              >
                <PhoneIcon className="w-4 h-4" />
                {t('driverVerification')}
              </Link>
              <span className="text-xs text-gray-600 hidden md:inline-flex items-center gap-2">
                {t('shopStatus')}: 
                <strong className={profile?.online ? 'text-green-600' : 'text-gray-500'}>
                  {profile?.online ? t('online') : t('offline')}
                </strong>
              </span>
              <button onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
                className="px-2 py-1 text-xs font-semibold rounded border border-gray-300/50 bg-white/50 hover:bg-white/80">
                {lang === 'en' ? 'አማ' : 'EN'}
              </button>
            </div>
          </div>
        </header>

        {notification && (
          <div className={`mx-6 mt-3 px-4 py-2 rounded-md text-sm flex items-center justify-between ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-3">
              <XCircleIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Glassmorphic Sidebar */}
          <aside className="w-[260px] bg-white/40 backdrop-blur-xl border-r border-white/40 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-6 border-b border-white/30 flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                  {profile?.logo_url ? <img src={resolveImageUrl(profile.logo_url)} className="w-full h-full object-cover rounded-full" alt="Logo" /> : <span className="text-2xl font-bold text-gray-400">{profile?.name?.charAt(0) || 'E'}</span>}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow ${profile?.online ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <h2 className="text-[15px] font-bold text-gray-900 text-center leading-tight w-full truncate">{profile?.name || 'Logistics Partner'}</h2>
              <p className="text-xs text-gray-500 mt-0.5">#{partnerId}</p>
              <button onClick={() => toggleOnline.mutate()} className={`mt-4 w-full h-8 flex items-center justify-center gap-1.5 text-xs font-bold rounded transition-colors ${
                profile?.online ? 'bg-red-500/10 text-red-700 border border-red-200' : 'bg-green-500/10 text-green-700 border border-green-200'}`}>
                <PowerIcon className="w-3.5 h-3.5" />
                {profile?.online ? t('goOffline') : t('goOnline')}
              </button>
            </div>

            <nav className="flex-1 py-4 flex flex-col gap-0.5">
              {[
                { id: 'board', label: t('deliveryBoard'), icon: Squares2X2Icon },
                { id: 'active', label: t('activeServices'), icon: ClipboardDocumentListIcon },
                { id: 'fleet', label: t('myFleet'), icon: TruckIcon },
                { id: 'drivers', label: t('drivers'), icon: UsersIcon },
                { id: 'rates', label: t('rateCards'), icon: CurrencyDollarIcon },
                { id: 'financials', label: t('financials'), icon: BanknotesIcon },
                { id: 'profile', label: t('companyProfile'), icon: BuildingOffice2Icon },
              ].map(item => (
                <button key={item.id} onClick={() => setNav(item.id as any)}
                  className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                    nav === item.id ? 'bg-orange-500/10 text-orange-700 font-bold' : 'text-gray-700 hover:bg-white/30'}`}>
                  <item.icon className={`w-4 h-4 ${nav === item.id ? 'text-orange-600' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-white/30">
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-sm text-gray-700 font-medium py-2 rounded hover:bg-white/50">
                <ArrowRightIcon className="w-4 h-4 rotate-180" />
                {t('signOut')}
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
              {nav === 'board' && (
                <DeliveryBoard
                  requests={sortedBoardRequests}
                  loading={boardLoading}
                  vehicles={vehicles}
                  drivers={drivers}
                  search={search}
                  setSearch={setSearch}
                  vehicleType={vehicleType}
                  setVehicleType={setVehicleType}
                  fulfillableOnly={fulfillableOnly}
                  setFulfillableOnly={setFulfillableOnly}
                  acceptMutation={acceptMutation}
                  acceptingRequestId={acceptingRequestId}
                  selectedVehicleMap={selectedVehicleMap}
                  setSelectedVehicleMap={setSelectedVehicleMap}
                  selectedDriverMap={selectedDriverMap}
                  setSelectedDriverMap={setSelectedDriverMap}
                  onViewDetails={setSelectedRequest}
                  t={t}
                />
              )}
              {nav === 'active' && (
                <ActiveServicesPanel
                  deliveries={visibleActiveDeliveries}
                  updateStatusMutation={updateStatusMutation}
                  showFulfilled={showFulfilled}
                  setShowFulfilled={setShowFulfilled}
                  t={t}
                />
              )}
              {nav === 'fleet' && (
                <FleetPanel
                  vehicles={filteredFleet}
                  fleetGrouped={fleetGrouped}
                  fleetFilterType={fleetFilterType}
                  setFleetFilterType={setFleetFilterType}
                  fleetFilterStatus={fleetFilterStatus}
                  setFleetFilterStatus={setFleetFilterStatus}
                  t={t}
                />
              )}
              {nav === 'drivers' && (
                <DriversPanel drivers={drivers} t={t} />
              )}
              {nav === 'rates' && <RateCardsPanel rateCards={rateCards} t={t} />}
              {nav === 'financials' && (
                <FinancialsPanel data={financials} loading={financialsLoading} t={t} />
              )}
              {nav === 'profile' && <ProfilePanel profile={profile} partnerId={partnerId!} t={t} />}
            </div>
          </main>
        </div>
      </div>

      {selectedRequest && (
        <RequestDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} t={t} />
      )}
    </TranslationContext.Provider>
  );
}

/* ============================== */
/*   Delivery Board Component     */
/* ============================== */
const DeliveryBoard: React.FC<{
  requests: DeliveryRequest[];
  loading: boolean;
  vehicles: Vehicle[];
  drivers: Driver[];
  search: string;
  setSearch: (v: string) => void;
  vehicleType: string;
  setVehicleType: (v: string) => void;
  fulfillableOnly: boolean;
  setFulfillableOnly: (v: boolean) => void;
  acceptMutation: any;
  acceptingRequestId: number | null;
  selectedVehicleMap: Record<number, number>;
  setSelectedVehicleMap: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  selectedDriverMap: Record<number, number>;
  setSelectedDriverMap: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  onViewDetails: (r: DeliveryRequest) => void;
  t: (key: string) => string;
}> = ({ requests, loading, vehicles, drivers, search, setSearch, vehicleType, setVehicleType, fulfillableOnly, setFulfillableOnly, acceptMutation, acceptingRequestId, selectedVehicleMap, setSelectedVehicleMap, selectedDriverMap, setSelectedDriverMap, onViewDetails, t }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 p-4 flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClass}>{t('searchPlaceholder')}</label>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-9`}
              placeholder={t('searchPlaceholder')}
            />
          </div>
        </div>
        <div className="w-36">
          <label className={labelClass}>{t('vehicleType')}</label>
          <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputClass}>
            <option value="">{t('allVehicles')}</option>
            <option value="motorcycle">{t('motorcycle')}</option>
            <option value="car">{t('car')}</option>
            <option value="van">{t('van')}</option>
            <option value="truck">{t('truck')}</option>
          </select>
        </div>
        <button
          onClick={() => setFulfillableOnly(!fulfillableOnly)}
          className={`h-9 px-3 inline-flex items-center gap-2 text-xs font-bold uppercase rounded border ${
            fulfillableOnly ? 'bg-orange-600 text-white' : 'bg-white/50 text-gray-700 hover:bg-white/80'
          } border-white/40`}
        >
          <FunnelIcon className="w-4 h-4" />
          Fulfillable Only
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">COD</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white/30 divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center"><ArrowPathIcon className="w-5 h-5 animate-spin mx-auto" /></td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">No open requests</td></tr>
            ) : (
              requests.map(req => (
                <tr key={req.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#{req.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2 max-w-[250px]">
                      <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <p className="font-medium text-gray-800 truncate">{truncateText(req.pickup_address, 30)}</p>
                        <p className="text-gray-500 truncate">{truncateText(req.delivery_address, 30)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {req.products?.slice(0, 4).map((item, idx) => (
                        <img
                          key={idx}
                          src={item.image_url || ''}
                          alt={item.title}
                          className="w-12 h-12 rounded-full border-2 border-white object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ))}
                      {(req.products?.length || 0) > 4 && (
                        <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                          +{(req.products?.length || 0) - 4}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {req.package_details?.chargeable_weight_kg || req.package_details?.weight_kg || 0} kg
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <VehicleTypeIcon type={req.required_vehicle_type} />
                      <span className="text-xs capitalize">{req.required_vehicle_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{req.cod_amount ? formatCurrency(req.cod_amount) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(req.estimated_earnings)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onViewDetails(req)} className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100" title="View Details">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <AcceptButton
                        req={req}
                        vehicles={vehicles}
                        drivers={drivers}
                        selectedVehicleId={selectedVehicleMap[req.id]}
                        setSelectedVehicle={(vid) => setSelectedVehicleMap(prev => ({ ...prev, [req.id]: vid }))}
                        selectedDriverId={selectedDriverMap[req.id]}
                        setSelectedDriver={(did) => setSelectedDriverMap(prev => ({ ...prev, [req.id]: did }))}
                        onAccept={() => {
                          const vid = selectedVehicleMap[req.id];
                          const did = selectedDriverMap[req.id];
                          if (vid && did) acceptMutation.mutate({ requestId: req.id, vehicleId: vid, driverId: did });
                        }}
                        isLoading={acceptingRequestId === req.id}
                        canAccept={req.can_accept}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AcceptButton: React.FC<{
  req: DeliveryRequest;
  vehicles: Vehicle[];
  drivers: Driver[];
  selectedVehicleId?: number;
  setSelectedVehicle: (id: number) => void;
  selectedDriverId?: number;
  setSelectedDriver: (id: number) => void;
  onAccept: () => void;
  isLoading: boolean;
  canAccept?: boolean;
}> = ({ req, vehicles, drivers, selectedVehicleId, setSelectedVehicle, selectedDriverId, setSelectedDriver, onAccept, isLoading, canAccept = true }) => {
  const compatibleVehicles = vehicles.filter(v => v.status === 'available' && v.vehicle_type === req.required_vehicle_type && v.max_weight_kg >= (req.package_details?.chargeable_weight_kg || req.package_details?.weight_kg || 0));
  const availableDrivers = drivers.filter(d => d.status === 'available');

  if (!canAccept || compatibleVehicles.length === 0 || availableDrivers.length === 0) {
    return <span className="text-xs text-gray-400">No vehicle/driver</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select value={selectedVehicleId || ''} onChange={e => setSelectedVehicle(Number(e.target.value))} className="h-8 px-2 text-xs border border-gray-300 rounded-md">
        <option value="">Select vehicle</option>
        {compatibleVehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
      </select>
      <select value={selectedDriverId || ''} onChange={e => setSelectedDriver(Number(e.target.value))} className="h-8 px-2 text-xs border border-gray-300 rounded-md">
        <option value="">Select driver</option>
        {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <button onClick={onAccept} disabled={!selectedVehicleId || !selectedDriverId || isLoading} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">
        {isLoading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
        Accept
      </button>
    </div>
  );
};

/* ============================== */
/*   Details Modal                */
/* ============================== */
const RequestDetailsModal: React.FC<{ request: DeliveryRequest; onClose: () => void; t: (key: string) => string }> = ({ request, onClose, t }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-900">Request #{request.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div><p className="text-xs font-medium text-gray-500 uppercase">Pickup</p><p className="text-sm text-gray-800">{request.pickup_address}</p></div>
          <div><p className="text-xs font-medium text-gray-500 uppercase">Delivery</p><p className="text-sm text-gray-800">{request.delivery_address}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs font-medium text-gray-500 uppercase">Weight</p><p className="text-sm text-gray-800">{request.package_details?.chargeable_weight_kg || request.package_details?.weight_kg} kg</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Volume</p><p className="text-sm text-gray-800">{request.package_details?.volume_cm3 || 0} cm³</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Vehicle</p><p className="text-sm capitalize text-gray-800">{request.required_vehicle_type}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase">Payout</p><p className="text-sm font-semibold text-green-700">{formatCurrency(request.estimated_earnings)}</p></div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Items</p>
            <div className="space-y-2">
              {request.products?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <img src={item.image_url || ''} alt="" className="w-12 h-12 rounded object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    {item.variant_attributes && Object.keys(item.variant_attributes).length > 0 && (
                      <p className="text-xs text-gray-500">{Object.entries(item.variant_attributes).map(([k,v]) => `${k}: ${v}`).join(', ')}</p>
                    )}
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================== */
/*   Active Services Panel        */
/* ============================== */
const ActiveServicesPanel: React.FC<{
  deliveries: ActiveDelivery[];
  updateStatusMutation: any;
  showFulfilled: boolean;
  setShowFulfilled: (v: boolean) => void;
  t: (key: string) => string;
}> = ({ deliveries, updateStatusMutation, showFulfilled, setShowFulfilled, t }) => {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('activeDispatches')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{deliveries.length} {t('activeSub')}</p>
        </div>
        <button
          onClick={() => setShowFulfilled(!showFulfilled)}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white/50 hover:bg-white/80 text-sm font-medium text-gray-700 flex items-center gap-2"
        >
          <ClipboardDocumentListIcon className="w-4 h-4" />
          {showFulfilled ? t('showActive') : t('showFulfilled')}
        </button>
      </div>

      {deliveries.length === 0 ? (
        <div className="text-center py-24 bg-white/60 backdrop-blur-lg rounded-xl border border-white/40">
          <ClipboardDocumentListIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-[15px] font-bold text-gray-900">{t('noActiveDispatches')}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map(d => (
            <ActiveDeliveryRow key={d.id} delivery={d} updateStatusMutation={updateStatusMutation} t={t} />
          ))}
        </div>
      )}
    </div>
  );
};

const ActiveDeliveryRow: React.FC<{ delivery: ActiveDelivery; updateStatusMutation: any; t: (key: string) => string }> = ({ delivery, updateStatusMutation, t }) => {
  const statusColors: Record<string, string> = {
    assigned: 'bg-gray-100 text-gray-700',
    accepted: 'bg-orange-100 text-orange-700',
    confirmed_pickup: 'bg-orange-200 text-orange-800',
    picked_up: 'bg-orange-300 text-orange-900',
    in_transit: 'bg-amber-100 text-amber-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
  };

  const nextStatusMap: Record<string, { label: string; next: string }> = {
    confirmed_pickup: { label: t('markPickedUp'), next: 'picked_up' },
    picked_up: { label: t('markInTransit'), next: 'in_transit' },
    in_transit: { label: t('confirmDeliveryComplete'), next: 'delivered' },
  };
  const action = nextStatusMap[delivery.status];

  const pickupContact = delivery.is_return ? delivery.buyer : delivery.seller;
  const deliveryContact = delivery.is_return ? delivery.seller : delivery.buyer;

  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-orange-100 shadow-sm p-4 transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-[180px]">
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[delivery.status] || 'bg-gray-100 text-gray-600'}`}>
              {delivery.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <p className="font-black text-gray-900">{t('job')} #{delivery.id}</p>
            {delivery.vehicle && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <VehicleTypeIcon type={delivery.vehicle.vehicle_type} className="w-4 h-4 text-orange-600" />
                {delivery.vehicle.plate_number} ({t(delivery.vehicle.vehicle_type)})
              </p>
            )}
            {delivery.driver && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <UsersIcon className="w-4 h-4 text-orange-600" />
                {t('assignedDriver')}: {delivery.driver.name} · {delivery.driver.phone}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-[250px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <MapPinIcon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-gray-700">Pickup</p>
                <p className="text-gray-800">{delivery.pickup_address}</p>
                {pickupContact && (
                  <p className="text-gray-500">Seller: {pickupContact.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPinIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-gray-700">Destination</p>
                <p className="text-gray-800">{delivery.delivery_address}</p>
                {deliveryContact && (
                  <p className="text-gray-500">Buyer: {deliveryContact.name}</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4">
            {pickupContact?.phone && (
              <a href={`tel:${pickupContact.phone}`} className="text-xs font-medium text-orange-600 hover:underline">
                {pickupContact.name} · {pickupContact.phone}
              </a>
            )}
            {deliveryContact?.phone && (
              <a href={`tel:${deliveryContact.phone}`} className="text-xs font-medium text-orange-600 hover:underline">
                {deliveryContact.name} · {deliveryContact.phone}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {delivery.cod_amount && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase">{t('collectCOD')}</p>
              <p className="text-sm font-black text-gray-900">{formatCurrency(delivery.cod_amount)}</p>
            </div>
          )}
          {action && (
            <button
              onClick={() => updateStatusMutation.mutate({ deliveryId: delivery.id, status: action.next })}
              disabled={updateStatusMutation.isLoading}
              className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase rounded shadow-sm"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>

      {delivery.products && delivery.products.length > 0 && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {delivery.products.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white/70 rounded-lg p-1.5 border border-gray-100 shrink-0">
              <img
                src={p.image_url || ''}
                alt={p.title}
                className="w-10 h-10 rounded object-cover"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
              <div className="pr-1">
                <p className="text-xs font-medium text-gray-800 line-clamp-1 max-w-[120px]">{p.title}</p>
                <p className="text-xs text-gray-500">Qty: {p.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================== */
/*   Fleet Panel                  */
/* ============================== */
const FleetPanel: React.FC<{
  vehicles: Vehicle[];
  fleetGrouped: Record<string, { total: number; available: number }>;
  fleetFilterType: string;
  setFleetFilterType: (v: string) => void;
  fleetFilterStatus: string;
  setFleetFilterStatus: (v: string) => void;
  t: (key: string) => string;
}> = ({ vehicles, fleetGrouped, fleetFilterType, setFleetFilterType, fleetFilterStatus, setFleetFilterStatus, t }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    vehicle_type: 'motorcycle', plate_number: '', max_weight_kg: 100,
    max_volume_cm3: '', refrigerated: false, fragile_capable: false,
    driver_name: '', driver_phone: ''
  });

  const saveMutation = useMutation(
    (data: any) => {
      const payload = { vehicle: data };
      return editingVehicle ? api.patch(`/api/v1/partner/vehicles/${editingVehicle.id}`, payload) : api.post('/api/v1/partner/vehicles', payload);
    },
    { onSuccess: () => { queryClient.invalidateQueries('partnerVehicles'); setShowModal(false); setEditingVehicle(null); } }
  );
  const deleteMutation = useMutation((id: number) => api.delete(`/api/v1/partner/vehicles/${id}`), { onSuccess: () => queryClient.invalidateQueries('partnerVehicles') });

  const handleOpenModal = (v?: Vehicle) => {
    if (v) {
      setEditingVehicle(v);
      setFormData({
        vehicle_type: v.vehicle_type,
        plate_number: v.plate_number,
        max_weight_kg: v.max_weight_kg,
        max_volume_cm3: v.max_volume_cm3?.toString() || '',
        refrigerated: v.refrigerated || false,
        fragile_capable: v.fragile_capable || false,
        driver_name: v.driver_name || '',
        driver_phone: v.driver_phone || ''
      });
    } else {
      setEditingVehicle(null);
      setFormData({ vehicle_type: 'motorcycle', plate_number: '', max_weight_kg: 100, max_volume_cm3: '', refrigerated: false, fragile_capable: false, driver_name: '', driver_phone: '' });
    }
    setShowModal(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('fleetAssetControl')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('fleetSub')}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(fleetGrouped).map(([type, { total, available }]) => (
              <span key={type} className="text-xs bg-white/60 backdrop-blur rounded-full px-2 py-0.5 border border-gray-200">
                {t(type)}: {available}/{total} {t('availableCount')}
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded shadow-sm flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> {t('registerNewUnit')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className={labelClass}>{t('vehicleType')}</label>
          <select value={fleetFilterType} onChange={e => setFleetFilterType(e.target.value)} className={inputClass}>
            <option value="all">{t('allVehicles')}</option>
            <option value="motorcycle">{t('motorcycle')}</option>
            <option value="car">{t('car')}</option>
            <option value="van">{t('van')}</option>
            <option value="truck">{t('truck')}</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('allStatus')}</label>
          <select value={fleetFilterStatus} onChange={e => setFleetFilterStatus(e.target.value)} className={inputClass}>
            <option value="all">{t('allStatus')}</option>
            <option value="available">{t('available')}</option>
            <option value="busy">Busy</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-24 bg-white/60 backdrop-blur-lg rounded-xl border border-white/40">
          <TruckIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-[15px] font-bold text-gray-900">{t('noVehicles')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white/60 backdrop-blur-lg rounded-xl border border-gray-100 p-4 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-200">
                    <VehicleTypeIcon type={v.vehicle_type} className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{v.plate_number}</p>
                    <p className="text-xs text-gray-500 capitalize">{t(v.vehicle_type)}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${v.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v.status}</span>
              </div>
              <div className="bg-gray-50/50 p-2.5 rounded border border-gray-100 space-y-1 mb-4">
                <div className="flex justify-between text-xs"><span>Max Weight:</span><span className="font-bold">{v.max_weight_kg} kg</span></div>
                {v.max_volume_cm3 && <div className="flex justify-between text-xs"><span>{t('volume')}:</span><span className="font-bold">{v.max_volume_cm3} cm³</span></div>}
                <div className="flex justify-between text-xs"><span>{t('refrigerated')}:</span><span className="font-bold">{v.refrigerated ? t('yes') : t('no')}</span></div>
                <div className="flex justify-between text-xs"><span>{t('fragileCapable')}:</span><span className="font-bold">{v.fragile_capable ? t('yes') : t('no')}</span></div>
                {v.driver_name && <div className="flex justify-between text-xs"><span>{t('assignedDriver')}:</span><span className="font-bold">{v.driver_name}</span></div>}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => handleOpenModal(v)} className="flex-1 h-8 flex items-center justify-center gap-1.5 text-xs font-bold uppercase text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50"><PencilSquareIcon className="w-3.5 h-3.5" /> {t('edit')}</button>
                <button onClick={() => deleteMutation.mutate(v.id)} className="w-8 h-8 flex items-center justify-center text-red-600 bg-white border border-gray-200 rounded hover:bg-red-50"><TrashIcon className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editingVehicle ? t('editVehicle') : t('addVehicle')}</h2>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
              <div><label className={labelClass}>{t('vehicleClassification')}</label><select value={formData.vehicle_type} onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })} className={inputClass}><option value="motorcycle">{t('motorcycle')}</option><option value="car">{t('car')}</option><option value="van">{t('van')}</option><option value="truck">{t('truck')}</option></select></div>
              <div><label className={labelClass}>{t('licensePlateNumber')}</label><input value={formData.plate_number} onChange={e => setFormData({ ...formData, plate_number: e.target.value })} placeholder="e.g. AA 3-B12345" className={inputClass} required /></div>
              <div><label className={labelClass}>{t('maxCapacityPayload')}</label><input type="number" value={formData.max_weight_kg} onChange={e => setFormData({ ...formData, max_weight_kg: Number(e.target.value) })} className={inputClass} required /></div>
              <div><label className={labelClass}>{t('volume')}</label><input type="number" value={formData.max_volume_cm3} onChange={e => setFormData({ ...formData, max_volume_cm3: e.target.value })} className={inputClass} /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={formData.refrigerated} onChange={e => setFormData({ ...formData, refrigerated: e.target.checked })} className="rounded border-gray-300 text-orange-600" /> {t('refrigerated')}</label>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={formData.fragile_capable} onChange={e => setFormData({ ...formData, fragile_capable: e.target.checked })} className="rounded border-gray-300 text-orange-600" /> {t('fragileCapable')}</label>
              </div>
              <div><label className={labelClass}>{t('primaryDriverName')}</label><input value={formData.driver_name} onChange={e => setFormData({ ...formData, driver_name: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t('driverPhone')}</label><input value={formData.driver_phone} onChange={e => setFormData({ ...formData, driver_phone: e.target.value })} className={inputClass} /></div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 text-xs font-bold uppercase text-gray-600 hover:bg-gray-100 rounded">{t('cancel')}</button><button type="submit" disabled={saveMutation.isLoading} className="h-9 px-5 bg-orange-600 text-white text-xs font-bold uppercase rounded shadow-sm">{saveMutation.isLoading ? t('saving') : t('saveUnit')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================== */
/*   Drivers Panel                */
/* ============================== */
const DriversPanel: React.FC<{ drivers: Driver[]; t: (key: string) => string }> = ({ drivers, t }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', license_number: '', address: '', status: 'available',
    photoFile: null as File | null,
    licensePhotoFile: null as File | null,
  });

  const saveMutation = useMutation(
    (data: any) => {
      const form = new FormData();
      form.append('name', data.name);
      form.append('phone', data.phone);
      form.append('license_number', data.license_number);
      form.append('address', data.address);
      form.append('status', data.status);
      if (data.photoFile) form.append('photoFile', data.photoFile);
      if (data.licensePhotoFile) form.append('licensePhotoFile', data.licensePhotoFile);

      return editingDriver
        ? api.patch(`/api/v1/partner/drivers/${editingDriver.id}`, form)
        : api.post('/api/v1/partner/drivers', form);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('partnerDrivers');
        setShowModal(false);
        setEditingDriver(null);
      },
    }
  );
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/api/v1/partner/drivers/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('partnerDrivers') }
  );

  const handleOpenModal = (d?: Driver) => {
    if (d) {
      setEditingDriver(d);
      setFormData({
        name: d.name,
        phone: d.phone,
        license_number: d.license_number || '',
        address: d.address || '',
        status: d.status || 'available',
        photoFile: null,
        licensePhotoFile: null,
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        phone: '',
        license_number: '',
        address: '',
        status: 'available',
        photoFile: null,
        licensePhotoFile: null,
      });
    }
    setShowModal(true);
  };

  const safeStatus = (status: any) => {
    const s = status || 'unknown';
    return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('drivers')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('noDriversSub')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded shadow-sm flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> {t('addDriver')}
        </button>
      </div>

      {drivers.length === 0 ? (
        <div className="text-center py-24 bg-white/60 backdrop-blur-lg rounded-xl border border-white/40">
          <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-[15px] font-bold text-gray-900">{t('noDrivers')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="bg-white/60 backdrop-blur-lg rounded-xl border border-gray-100 p-4 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-start gap-3">
                {d.photo_url ? (
                  <img
                    src={resolveImageUrl(d.photo_url)}
                    alt={d.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                    <UsersIcon className="w-7 h-7 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-black text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.phone}</p>
                  <span
                    className={`inline-flex mt-1 px-2 py-0.5 text-xs rounded-full ${
                      d.status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : d.status === 'on_delivery'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {safeStatus(d.status)}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <p>License: {d.license_number || '—'}</p>
                <p>Address: {d.address || '—'}</p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenModal(d)}
                  className="flex-1 h-8 flex items-center justify-center gap-1.5 text-xs font-bold uppercase text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" /> {t('edit')}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(d.id)}
                  className="w-8 h-8 flex items-center justify-center text-red-600 bg-white border border-gray-200 rounded hover:bg-red-50"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingDriver ? t('editDriver') : t('addDriver')}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className={labelClass}>{t('driverName')}</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('driverPhone')}</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('licenseNumber')}</label>
                <input
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('address')}</label>
                <input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('status')}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="available">Available</option>
                  <option value="on_delivery">On Delivery</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className={labelClass}>{t('photo')}</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFormData((prev) => ({ ...prev, photoFile: file || null }));
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('licensePhoto')}</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFormData((prev) => ({ ...prev, licensePhotoFile: file || null }));
                    }}
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 text-xs font-bold uppercase text-gray-600 hover:bg-gray-100 rounded"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isLoading}
                  className="h-9 px-5 bg-orange-600 text-white text-xs font-bold uppercase rounded shadow-sm"
                >
                  {saveMutation.isLoading ? t('saving') : t('saveUnit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================== */
/*   Rate Cards Panel             */
/* ============================== */
const RateCardsPanel: React.FC<{ rateCards: RateCard[]; t: (key: string) => string }> = ({ rateCards, t }) => {
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredRateCards = useMemo(() => {
    if (selectedType === 'all') return rateCards;
    return rateCards.filter(rc => rc.vehicle_type === selectedType);
  }, [rateCards, selectedType]);

  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(rateCards.map(rc => rc.vehicle_type)));
    return types.length > 0 ? types : ['motorcycle', 'car', 'van', 'truck'];
  }, [rateCards]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('compensationRates')}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{t('ratesSub')}</p>
      </div>

      <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className={`${labelClass} mb-0`}>{t('vehicleType')}</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={inputClass}>
            <option value="all">{t('allVehicles')}</option>
            {availableTypes.map(type => <option key={type} value={type}>{t(type)}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('vehicleType')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('baseFare')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('perKm')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('minGuarantee')}</th>
            </tr>
          </thead>
          <tbody className="bg-white/30 divide-y divide-gray-200">
            {filteredRateCards.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">{t('noRates')}</td></tr>
            ) : (
              filteredRateCards.map(rate => (
                <tr key={rate.id} className="hover:bg-white/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 capitalize">{t(rate.vehicle_type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(rate.base_rate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(rate.per_km_rate)} / km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(rate.min_charge)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================== */
/*   Financials Panel             */
/* ============================== */
const FinancialsPanel: React.FC<{
  data: any;
  loading: boolean;
  t: (key: string) => string;
}> = ({ data, loading, t }) => {
  if (loading) {
    return <div className="text-center py-20"><ArrowPathIcon className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>;
  }

  const pending = data?.pending_payout || 0;
  const paid = data?.paid_payout || 0;
  const codOwed = data?.cod_owed || 0;
  const net = data?.net_balance || 0;
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('financials')}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your earnings and cash on delivery settlements</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">{t('pendingPayout')}</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(pending)}</p>
          <p className="text-xs text-gray-500">{t('weOweYou')}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">{t('paidPayout')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(paid)}</p>
          <p className="text-xs text-gray-500">{t('alreadySettled')}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">{t('codOwed')}</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(codOwed)}</p>
          <p className="text-xs text-gray-500">{t('youOwePlatform')}</p>
        </div>
        <div className={`bg-white/60 backdrop-blur-lg rounded-xl border p-4 ${
          net >= 0 ? 'border-green-200' : 'border-red-200'
        }`}>
          <p className="text-xs font-medium text-gray-500 uppercase">{t('netBalance')}</p>
          <p className={`text-2xl font-bold mt-1 ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(net))}
          </p>
          <p className="text-xs text-gray-500">{net >= 0 ? t('weOweYou') : t('youOwePlatform')}</p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('type')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('description')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('date')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('amount')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="bg-white/30 divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">{t('noTransactions')}</td></tr>
            ) : (
              transactions.map((tx: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/50">
                  <td className="px-4 py-3 text-sm">
                    {tx.type === 'payout_paid' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">{t('paidPayout')}</span>
                    ) : tx.type === 'payout_pending' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">{t('pendingPayout')}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">{t('codOwed')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {tx.items && tx.items.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {tx.items.map((item: any, i: number) => (
                          <span key={i} className="text-xs text-gray-600">
                            {item.title} (x{item.quantity})
                          </span>
                        ))}
                      </div>
                    ) : (
                      tx.description
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tx.date ? new Date(tx.date).toLocaleDateString() : '—'}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${
                    tx.type === 'cod_collected' ? 'text-red-600' : 'text-green-700'
                  }`}>
                    {tx.type === 'cod_collected' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      tx.status === 'paid' || tx.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================== */
/*   Profile Panel                */
/* ============================== */
const ProfilePanel: React.FC<{ profile: PartnerProfile; partnerId: number; t: (key: string) => string }> = ({ profile, partnerId, t }) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold text-gray-900">{t('institutionalProfile')}</h1><p className="text-gray-500 text-sm mt-0.5">{t('profileSub')}</p></div>
      <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3 backdrop-blur">
        <div className="flex items-center gap-3"><ShieldCheckIcon className="w-8 h-8 text-green-600" /><div><h3 className="text-sm font-bold text-green-900">{t('verifiedEnterprise')}</h3><p className="text-xs text-green-700 mt-0.5">{t('verifiedDesc')}</p></div></div>
        <span className="text-xs font-bold uppercase tracking-wider bg-green-600 text-white px-2.5 py-1 rounded">{t('activeTerminal')}</span>
      </div>
      <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/40 overflow-hidden p-6 space-y-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">{t('corporateIdentity')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className={labelClass}>{t('companyRegisteredName')}</label><input readOnly value={profile?.name || '—'} className={`${inputClass} bg-white/50`} /></div><div><label className={labelClass}>{t('dispatchPhoneLine')}</label><input readOnly value={profile?.phone || '—'} className={`${inputClass} bg-white/50`} /></div><div><label className={labelClass}>{t('tinNumber')}</label><input readOnly value={profile?.tin || '—'} className={`${inputClass} bg-white/50`} /></div><div><label className={labelClass}>{t('operatingRegion')}</label><input readOnly value={profile?.operating_region || '—'} className={`${inputClass} bg-white/50`} /></div></div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 pt-2">{t('settlementBanking')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className={labelClass}>{t('commercialBankName')}</label><input readOnly value={profile?.bank_name || '—'} className={`${inputClass} bg-white/50`} /></div><div><label className={labelClass}>{t('settlementAccount')}</label><input readOnly value={profile?.account_number || '—'} className={`${inputClass} bg-white/50`} /></div></div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 pt-2">{t('complianceCredentials')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DocCard title={t('businessLicense')} url={profile?.business_license_url} t={t} />
          <DocCard title={t('tinRegistration')} url={profile?.tin_url} t={t} />
          <DocCard title={t('fleetInsurancePolicy')} url={profile?.insurance_url} t={t} />
        </div>
      </div>
    </div>
  );
};

const DocCard: React.FC<{ title: string; url?: string; t: (key: string) => string }> = ({ title, url, t }) => (
  <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur text-center">
    <DocumentTextIcon className={`w-6 h-6 ${url ? 'text-orange-600' : 'text-gray-400'}`} />
    <span className="text-xs font-bold text-gray-800">{title}</span>
    {url ? <a href={resolveImageUrl(url)} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-orange-600 hover:underline mt-1">{t('reviewDocument')}</a> : <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{t('notUploaded')}</span>}
  </div>
);