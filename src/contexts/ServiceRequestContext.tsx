import { createContext, useContext, useState, ReactNode } from 'react';

// Customer Interface
export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
}

// Service Request Interface
export interface ServiceRequest {
    id: string;
    serviceType: string;
    customer: Customer;
    device: string;
    productCategory: string;
    productType: string;
    brand: string;
    model: string;
    problemPreset: string;
    problemDescription: string;
    internalNotes: string;
    tags: string;
    parts: PartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    grandTotal: number;
    images: string[];
    status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
    createdDate: string;
}

export interface PartItem {
    id: string;
    name: string;
    sku: string;
    status: string;
    quantity: number;
    price: number;
}

interface ServiceRequestContextType {
    serviceRequests: ServiceRequest[];
    customers: Customer[];
    addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'createdDate' | 'status'>) => void;
    updateServiceRequest: (id: string, request: Omit<ServiceRequest, 'id' | 'createdDate' | 'status'>) => void;
    addCustomer: (customer: Omit<Customer, 'id'>) => void;
    getServiceRequestById: (id: string) => ServiceRequest | undefined;
    deleteServiceRequest: (id: string) => void;
}

const ServiceRequestContext = createContext<ServiceRequestContextType | undefined>(undefined);

// Initial mock data
const initialCustomers: Customer[] = [
    {
        id: 'CUST001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 234 567 8900',
    },
    {
        id: 'CUST002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 234 567 8901',
    },
    {
        id: 'CUST003',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        phone: '+1 234 567 8902',
    },
];

const initialServiceRequests: ServiceRequest[] = [
    {
        id: 'SR001',
        serviceType: 'Screen Replacement',
        customer: initialCustomers[0],
        device: 'iPhone 14 Pro',
        productCategory: 'electronics',
        productType: 'mobile',
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        problemPreset: 'screen',
        problemDescription: 'Screen cracked after accidental drop',
        internalNotes: 'Customer is VIP, priority service',
        tags: 'vip, urgent',
        parts: [
            {
                id: '1',
                name: 'iPhone 14 Pro Screen',
                sku: 'A2890-SCR',
                status: 'In Stock',
                quantity: 1,
                price: 279.00,
            },
        ],
        subtotal: 279.00,
        discount: 0,
        tax: 22.32,
        grandTotal: 301.32,
        images: [
            'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400',
        ],
        status: 'In Progress',
        createdDate: '2024-12-01',
    },
    {
        id: 'SR002',
        serviceType: 'Battery Replacement',
        customer: initialCustomers[1],
        device: 'Samsung Galaxy S23',
        productCategory: 'electronics',
        productType: 'mobile',
        brand: 'Samsung',
        model: 'Galaxy S23',
        problemPreset: 'battery',
        problemDescription: 'Battery draining quickly, phone shuts down at 20%',
        internalNotes: '',
        tags: '',
        parts: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        grandTotal: 0,
        images: [],
        status: 'Pending',
        createdDate: '2024-11-30',
    },
];

export const ServiceRequestProvider = ({ children }: { children: ReactNode }) => {
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(initialServiceRequests);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

    const addServiceRequest = (request: Omit<ServiceRequest, 'id' | 'createdDate' | 'status'>) => {
        const newRequest: ServiceRequest = {
            ...request,
            id: `SR${String(serviceRequests.length + 1).padStart(3, '0')}`,
            createdDate: new Date().toISOString().split('T')[0],
            status: 'Pending',
        };
        setServiceRequests((prev) => [newRequest, ...prev]);
    };

    const updateServiceRequest = (id: string, request: Omit<ServiceRequest, 'id' | 'createdDate' | 'status'>) => {
        setServiceRequests((prev) =>
            prev.map((req) => {
                if (req.id === id) {
                    return {
                        ...request,
                        id: req.id,
                        createdDate: req.createdDate,
                        status: req.status,
                    };
                }
                return req;
            })
        );
    };

    const addCustomer = (customer: Omit<Customer, 'id'>) => {
        const newCustomer: Customer = {
            ...customer,
            id: `CUST${String(customers.length + 1).padStart(3, '0')}`,
        };
        setCustomers((prev) => [...prev, newCustomer]);
    };

    const getServiceRequestById = (id: string) => {
        return serviceRequests.find((req) => req.id === id);
    };

    const deleteServiceRequest = (id: string) => {
        setServiceRequests((prev) => prev.filter((req) => req.id !== id));
    };

    return (
        <ServiceRequestContext.Provider
            value={{
                serviceRequests,
                customers,
                addServiceRequest,
                updateServiceRequest,
                addCustomer,
                getServiceRequestById,
                deleteServiceRequest,
            }}
        >
            {children}
        </ServiceRequestContext.Provider>
    );
};

export const useServiceRequest = () => {
    const context = useContext(ServiceRequestContext);
    if (context === undefined) {
        throw new Error('useServiceRequest must be used within a ServiceRequestProvider');
    }
    return context;
};
