// import {
//     Smartphone,
//     Laptop,
//     Tablet,
//     Monitor,
//     Refrigerator,
//     WashingMachine,
//     Microwave,
//     Sofa,
//     Table2,
//     Armchair,
//     Bed,
// } from 'lucide-react';

// type ProductCategory = 'electronics' | 'appliances' | 'furniture';

// interface ProductTypeSelectorProps {
//     productCategory: ProductCategory;
//     productType: string;
//     setProductType: (type: string) => void;
// }

// export const ProductTypeSelector = ({ productCategory, productType, setProductType }: ProductTypeSelectorProps) => {
//     return (
//         <div className="border-b border-gray-200 pb-4 mb-4">
//             <h3 className="text-sm font-bold text-gray-900 mb-3">Select Product Type</h3>

//             {/* Electronics Product Types */}
//             {productCategory === 'electronics' && (
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     <button
//                         type="button"
//                         onClick={() => setProductType('mobile')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'mobile'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Smartphone className={`h-8 w-8 mb-2 ${productType === 'mobile' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'mobile' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Mobile
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('laptop')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'laptop'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Laptop className={`h-8 w-8 mb-2 ${productType === 'laptop' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'laptop' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Laptop
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('tablet')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'tablet'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Tablet className={`h-8 w-8 mb-2 ${productType === 'tablet' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'tablet' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Tablet
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('pc')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'pc'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Monitor className={`h-8 w-8 mb-2 ${productType === 'pc' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'pc' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             PC
//                         </span>
//                     </button>
//                 </div>
//             )}

//             {/* Appliances Product Types */}
//             {productCategory === 'appliances' && (
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     <button
//                         type="button"
//                         onClick={() => setProductType('refrigerator')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'refrigerator'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Refrigerator className={`h-8 w-8 mb-2 ${productType === 'refrigerator' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'refrigerator' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Refrigerator
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('washing-machine')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'washing-machine'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <WashingMachine className={`h-8 w-8 mb-2 ${productType === 'washing-machine' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'washing-machine' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Washing Machine
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('microwave')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'microwave'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Microwave className={`h-8 w-8 mb-2 ${productType === 'microwave' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'microwave' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Microwave
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('dishwasher')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'dishwasher'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Refrigerator className={`h-8 w-8 mb-2 ${productType === 'dishwasher' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'dishwasher' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Dishwasher
//                         </span>
//                     </button>
//                 </div>
//             )}

//             {/* Furniture Product Types */}
//             {productCategory === 'furniture' && (
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     <button
//                         type="button"
//                         onClick={() => setProductType('sofa')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'sofa'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Sofa className={`h-8 w-8 mb-2 ${productType === 'sofa' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'sofa' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Sofa
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('table')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'table'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Table2 className={`h-8 w-8 mb-2 ${productType === 'table' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'table' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Table
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('chair')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'chair'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Armchair className={`h-8 w-8 mb-2 ${productType === 'chair' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'chair' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Chair
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() => setProductType('bed')}
//                         className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${productType === 'bed'
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 bg-white'
//                             }`}
//                     >
//                         <Bed className={`h-8 w-8 mb-2 ${productType === 'bed' ? 'text-blue-600' : 'text-gray-600'}`} />
//                         <span className={`text-sm font-medium ${productType === 'bed' ? 'text-blue-600' : 'text-gray-700'}`}>
//                             Bed
//                         </span>
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// };
