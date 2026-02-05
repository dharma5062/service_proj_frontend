// import { useState, useEffect } from 'react';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Switch } from '@/components/ui/switch';
// import { toast } from 'sonner';
// import { DataTable, Column } from '@/components/ui/table/tableComponents';
// import { Card, CardContent, CardHeader } from '@/components/ui/card';
// import {
//     Shop,
//     fetchShops,
//     createShop,
//     updateShop,
//     deleteShop,
//     CreateShopPayload,
// } from '@/pages/serviceAPI/ShopsAPI';
// import { Store, Plus, Eye, Edit2, Trash2, Image as ImageIcon, Upload } from 'lucide-react';

// const ShopsPage = () => {
//     const [shops, setShops] = useState<Shop[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [pageSize, setPageSize] = useState(10);
//     const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//     const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
//     const [viewDialogOpen, setViewDialogOpen] = useState(false);
//     const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
//     const [formDialogOpen, setFormDialogOpen] = useState(false);
//     const [isEditMode, setIsEditMode] = useState(false);

//     // Form State
//     const [formData, setFormData] = useState({
//         name: '',
//         description: '',
//         active: true,
//         shop_owner_id: '' as string | number,
//     });
//     const [selectedImage, setSelectedImage] = useState<File | null>(null);
//     const [imagePreview, setImagePreview] = useState<string | null>(null);
//     const [formErrors, setFormErrors] = useState<Record<string, string>>({});
//     const [submitting, setSubmitting] = useState(false);

//     // Initial Load
//     useEffect(() => {
//         loadShops();
//     }, []);

//     const loadShops = async () => {
//         try {
//             setLoading(true);
//             const response = await fetchShops();
//             console.log('fetchShops response:', response);

//             let shopsList: Shop[] = [];

//             if (Array.isArray(response)) {
//                 shopsList = response;
//             } else if (response && typeof response === 'object') {
//                 if (Array.isArray(response.data)) {
//                     shopsList = response.data;
//                 } else if (response.data && Array.isArray(response.data.data)) {
//                     shopsList = response.data.data;
//                 }
//             }

//             // Ensure we always safeguard against non-array values
//             if (!Array.isArray(shopsList)) {
//                 console.warn('shopsList extracted is not an array, defaulting to empty array. Extracted:', shopsList);
//                 shopsList = [];
//             }

//             setShops(shopsList);
//         } catch (error) {
//             console.error('Error loading shops:', error);
//             toast.error('Failed to load shops');
//             setShops([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Actions
//     const handleCreate = () => {
//         setIsEditMode(false);
//         setFormData({
//             name: '',
//             description: '',
//             active: true,
//             shop_owner_id: '',
//         });
//         setSelectedImage(null);
//         setImagePreview(null);
//         setFormErrors({});
//         setFormDialogOpen(true);
//     };

//     const handleEdit = (shop: Shop) => {
//         setIsEditMode(true);
//         setSelectedShop(shop);
//         setFormData({
//             name: shop.name || '',
//             description: shop.description || '',
//             active: shop.active,
//             shop_owner_id: shop.shop_owner_id || '',
//         });
//         setImagePreview(shop.image_url);
//         setSelectedImage(null);
//         setFormErrors({});
//         setFormDialogOpen(true);
//     };

//     const confirmDelete = (shop: Shop) => {
//         setSelectedShop(shop);
//         setSelectedShopId(shop.id);
//         setDeleteDialogOpen(true);
//     };

//     const handleDelete = async () => {
//         if (!selectedShopId) return;
//         try {
//             await deleteShop(selectedShopId);
//             toast.success('Shop deleted successfully');
//             setDeleteDialogOpen(false);
//             loadShops();
//         } catch (error) {
//             toast.error('Failed to delete shop');
//         }
//     };

//     const handleView = (shop: Shop) => {
//         setSelectedShop(shop);
//         setViewDialogOpen(true);
//     };

//     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             setSelectedImage(file);
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setImagePreview(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const validateForm = () => {
//         const errors: Record<string, string> = {};
//         if (!formData.name.trim()) errors.name = 'Shop name is required';
//         setFormErrors(errors);
//         return Object.keys(errors).length === 0;
//     };

//     const handleSubmit = async () => {
//         if (!validateForm()) return;
//         setSubmitting(true);
//         try {
//             const payload: CreateShopPayload = {
//                 name: formData.name,
//                 description: formData.description,
//                 active: formData.active,
//                 shop_owner_id: formData.shop_owner_id ? Number(formData.shop_owner_id) : null,
//                 image: selectedImage,
//             };

//             if (isEditMode && selectedShop) {
//                 await updateShop(selectedShop.id, payload);
//                 toast.success('Shop updated successfully');
//             } else {
//                 await createShop(payload);
//                 toast.success('Shop created successfully');
//             }
//             setFormDialogOpen(false);
//             loadShops();
//         } catch (error) {
//             toast.error(isEditMode ? 'Failed to update shop' : 'Failed to create shop');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     // Columns
//     const columns: Column<Shop>[] = [
//         {
//             title: 'Image',
//             dataIndex: 'image_url',
//             key: 'image',
//             render: (_value, shop) => (
//                 <div className="h-10 w-10 relative rounded overflow-hidden bg-gray-100 border border-gray-200">
//                     {shop.image ? (
//                         <img
//                             src={shop.image}
//                             alt={shop.name}
//                             className="h-full w-full object-cover"
//                             onError={(e) => {
//                                 (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=Shop';
//                             }}
//                         />
//                     ) : (
//                         <div className="flex h-full w-full items-center justify-center text-gray-400">
//                             <Store size={20} />
//                         </div>
//                     )}
//                 </div>
//             ),
//         },
//         {
//             title: 'Name',
//             dataIndex: 'name',
//             key: 'name',
//             sortable: true,
//             className: 'font-medium text-gray-900',
//         },
//         {
//             title: 'Description',
//             dataIndex: 'description',
//             key: 'description',
//             render: (value) => (
//                 <span className="text-gray-500 truncate block max-w-xs" title={value}>
//                     {value || '-'}
//                 </span>
//             ),
//         },
//         {
//             title: 'Active',
//             dataIndex: 'active',
//             key: 'active',
//             sortable: true,
//             render: (value) => (
//                 <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
//                     {value ? 'Active' : 'Inactive'}
//                 </Badge>
//             ),
//         },
//         {
//             title: 'Actions',
//             key: 'actions',
//             dataIndex: 'id',
//             render: (_, shop) => (
//                 <div className="flex items-center gap-2">
//                     <Button variant="ghost" size="icon" onClick={() => handleView(shop)} title="View Details">
//                         <Eye className="h-4 w-4 text-blue-500" />
//                     </Button>
//                     <Button variant="ghost" size="icon" onClick={() => handleEdit(shop)} title="Edit Shop">
//                         <Edit2 className="h-4 w-4 text-green-500" />
//                     </Button>
//                     <Button variant="ghost" size="icon" onClick={() => confirmDelete(shop)} title="Delete Shop">
//                         <Trash2 className="h-4 w-4 text-red-500" />
//                     </Button>
//                 </div>
//             ),
//         },
//     ];

//     return (
//         <div className="space-y-6">
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-lg font-bold tracking-tight text-gray-900">Shops</h1>
//                     <p className="text-muted-foreground text-sm mt-1">
//                         Manage your shops efficiently.
//                     </p>
//                 </div>
//                 <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
//                     <Plus className="mr-2 h-4 w-4" /> Add Shop
//                 </Button>
//             </div>

//             <Card className="shadow-sm border-gray-200">
//                 <CardHeader className="pb-0">
//                 </CardHeader>
//                 <CardContent>
//                     <DataTable
//                         data={shops}
//                         columns={columns}
//                         searchKey="name"
//                         loading={loading}
//                         pagination={{
//                             current: currentPage,
//                             pageSize: pageSize,
//                             total: shops.length,
//                             onChange: (page, size) => {
//                                 setCurrentPage(page);
//                                 setPageSize(size);
//                             },
//                         }}
//                     />
//                 </CardContent>
//             </Card>

//             {/* Create/Edit Modal */}
//             <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
//                 <DialogContent className="sm:max-w-[600px]">
//                     <DialogHeader>
//                         <DialogTitle>{isEditMode ? 'Edit Shop' : 'Create New Shop'}</DialogTitle>
//                         <DialogDescription>
//                             {isEditMode ? 'Update your shop details below.' : 'Add a new shop to your system.'}
//                         </DialogDescription>
//                     </DialogHeader>

//                     <div className="grid gap-6 py-4">
//                         {/* Image Upload */}
//                         <div className="flex flex-col items-center gap-4">
//                             <div className="h-32 w-32 relative rounded-full overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 group hover:border-primary transition-colors">
//                                 {imagePreview ? (
//                                     <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
//                                 ) : (
//                                     <div className="flex flex-col items-center justify-center h-full text-gray-400">
//                                         <ImageIcon className="h-8 w-8 mb-2" />
//                                         <span className="text-xs">No Image</span>
//                                     </div>
//                                 )}
//                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
//                                     onClick={() => document.getElementById('image-upload')?.click()}>
//                                     <Upload className="h-6 w-6 text-white" />
//                                 </div>
//                             </div>
//                             <input
//                                 id="image-upload"
//                                 type="file"
//                                 accept="image/*"
//                                 className="hidden"
//                                 onChange={handleImageChange}
//                             />
//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 className="text-xs"
//                                 onClick={() => document.getElementById('image-upload')?.click()}
//                             >
//                                 Change Image
//                             </Button>
//                         </div>

//                         <div className="grid gap-4">
//                             <div className="grid gap-2">
//                                 <Label htmlFor="name">Shop Name <span className="text-red-500">*</span></Label>
//                                 <Input
//                                     id="name"
//                                     placeholder="Enter shop name"
//                                     value={formData.name}
//                                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                                     className={formErrors.name ? 'border-red-500' : ''}
//                                 />
//                                 {formErrors.name && <span className="text-xs text-red-500">{formErrors.name}</span>}
//                             </div>

//                             <div className="grid gap-2">
//                                 <Label htmlFor="description">Description</Label>
//                                 <Textarea
//                                     id="description"
//                                     placeholder="Enter shop description"
//                                     value={formData.description}
//                                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                                     className="min-h-[100px]"
//                                 />
//                             </div>

//                             <div className="grid gap-2">
//                                 <Label htmlFor="shop_owner_id">Shop Owner ID (Optional)</Label>
//                                 <Input
//                                     id="shop_owner_id"
//                                     type="number"
//                                     placeholder="Enter owner ID"
//                                     value={formData.shop_owner_id}
//                                     onChange={(e) => setFormData({ ...formData, shop_owner_id: e.target.value })}
//                                 />
//                             </div>

//                             <div className="flex items-center space-x-2">
//                                 <Switch
//                                     id="active"
//                                     checked={formData.active}
//                                     onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
//                                 />
//                                 <Label htmlFor="active">Active Status</Label>
//                             </div>
//                         </div>
//                     </div>

//                     <DialogFooter>
//                         <Button variant="outline" onClick={() => setFormDialogOpen(false)}>Cancel</Button>
//                         <Button onClick={handleSubmit} disabled={submitting}>
//                             {submitting ? 'Saving...' : (isEditMode ? 'Update Shop' : 'Create Shop')}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             {/* View Shop Dialog */}
//             <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>Shop Details</DialogTitle>
//                     </DialogHeader>
//                     {selectedShop && (
//                         <div className="space-y-6">
//                             <div className="flex items-center gap-4">
//                                 <div className="h-20 w-20 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
//                                     {selectedShop.image ? (
//                                         <img src={selectedShop.image} alt={selectedShop.name} className="h-full w-full object-cover" />
//                                     ) : (
//                                         <div className="flex h-full w-full items-center justify-center text-gray-400">
//                                             <Store size={32} />
//                                         </div>
//                                     )}
//                                 </div>
//                                 <div>
//                                     <h3 className="text-xl font-bold text-gray-900">{selectedShop.name}</h3>
//                                     <Badge className={selectedShop.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
//                                         {selectedShop.active ? 'Active' : 'Inactive'}
//                                     </Badge>
//                                 </div>
//                             </div>

//                             <div className="space-y-1">
//                                 <Label className="text-xs text-gray-500 uppercase tracking-wide">Description</Label>
//                                 <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
//                                     {selectedShop.description || 'No description provided.'}
//                                 </p>
//                             </div>

//                             {selectedShop.shop_owner_id && (
//                                 <div className="space-y-1">
//                                     <Label className="text-xs text-gray-500 uppercase tracking-wide">Owner ID</Label>
//                                     <p className="text-sm font-medium">{selectedShop.shop_owner_id}</p>
//                                 </div>
//                             )}

//                             <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 pt-4 border-t">
//                                 <div>
//                                     <span>Created: </span>
//                                     {selectedShop.created_at ? new Date(selectedShop.created_at).toLocaleDateString() : '-'}
//                                 </div>
//                                 <div>
//                                     <span>Updated: </span>
//                                     {selectedShop.updated_at ? new Date(selectedShop.updated_at).toLocaleDateString() : '-'}
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                     <DialogFooter>
//                         <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             {/* Delete Confirmation */}
//             <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//                 <AlertDialogContent>
//                     <AlertDialogHeader>
//                         <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//                         <AlertDialogDescription>
//                             This action cannot be undone. This will permanently delete the shop named
//                             <span className="font-bold text-gray-900"> {selectedShop?.name} </span>
//                             and remove its data from the servers.
//                         </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                         <AlertDialogCancel>Cancel</AlertDialogCancel>
//                         <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
//                             Delete Shop
//                         </AlertDialogAction>
//                     </AlertDialogFooter>
//                 </AlertDialogContent>
//             </AlertDialog>
//         </div>
//     );
// };

// export default ShopsPage;
