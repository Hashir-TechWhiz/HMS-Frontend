"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getRooms, createRoom, updateRoom, deleteRoom } from "@/services/roomService";
import { useEdgeStore } from "@/lib/edgestore";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import { EdgeStoreUploader } from "@/components/common/EdgeStoreUploader";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import TextAreaField from "@/components/forms/TextAreaField";
import SelectField from "@/components/forms/SelectField";
import { toast } from "sonner";
import { format } from "date-fns";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";

const RoomsPage = () => {
    const { role, loading: authLoading } = useAuth();
    const { edgestore } = useEdgeStore();

    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [imageFiles, setImageFiles] = useState<(File | string)[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<{
        roomNumber: string;
        roomType: RoomType;
        capacity: number;
        pricePerNight: number;
        status: RoomStatus;
        description: string;
    }>();

    // Fetch rooms
    const fetchRooms = useCallback(async () => {
        if (!role || authLoading) return;

        try {
            setLoading(true);
            const response = await getRooms();

            if (response.success) {
                const roomsData: any = response.data;
                const roomsArray = Array.isArray(roomsData) ? roomsData : (roomsData?.items || []);

                setRooms(roomsArray);
                setTotalPages(1);
                setTotalItems(roomsArray.length);
            } else {
                toast.error(response.message || "Failed to fetch rooms");
            }
        } catch {
            toast.error("An error occurred while fetching rooms");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading]);

    useEffect(() => {
        if (role && !authLoading) {
            fetchRooms();
        }
    }, [role, authLoading, fetchRooms]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Handle view details
    const handleViewDetails = (room: IRoom) => {
        setSelectedRoom(room);
        setViewDialogOpen(true);
    };

    // Handle add room
    const handleAddClick = () => {
        setIsEditMode(false);
        setSelectedRoom(null);
        setImageFiles([]);
        reset({
            roomNumber: "",
            roomType: "Single",
            capacity: 1,
            pricePerNight: 0,
            status: "available",
            description: "",
        });
        setFormDialogOpen(true);
    };

    // Handle edit room
    const handleEditClick = (room: IRoom) => {
        setIsEditMode(true);
        setSelectedRoom(room);
        setImageFiles(room.images);
        reset({
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            capacity: room.capacity,
            pricePerNight: room.pricePerNight,
            status: room.status,
            description: room.description || "",
        });
        setFormDialogOpen(true);
    };

    // Handle delete room
    const handleDeleteClick = (room: IRoom) => {
        setSelectedRoom(room);
        setDeleteDialogOpen(true);
    };

    // Upload images to EdgeStore
    const uploadImages = async (files: (File | string)[]): Promise<string[]> => {
        const urls: string[] = [];

        for (const file of files) {
            if (typeof file === "string") {
                // Already uploaded URL, keep it
                urls.push(file);
            } else if (file instanceof File) {
                // Upload new file
                const result = await edgestore.rooms.upload({
                    file,
                });
                urls.push(result.url);
            }
        }

        return urls;
    };

    // Delete images from EdgeStore
    const deleteImages = async (urls: string[]) => {
        for (const url of urls) {
            try {
                await edgestore.rooms.delete({ url });
            } catch (error) {
                console.error(`Failed to delete image ${url}:`, error);
            }
        }
    };

    // Handle form submit
    const onSubmit = async (data: {
        roomNumber: string;
        roomType: RoomType;
        capacity: number;
        pricePerNight: number;
        status: RoomStatus;
        description: string;
    }) => {
        if (imageFiles.length < 1) {
            toast.error("At least one image is required");
            return;
        }

        if (imageFiles.length > 4) {
            toast.error("Maximum of 4 images allowed");
            return;
        }

        try {
            setFormLoading(true);

            // Upload new images first
            const imageUrls = await uploadImages(imageFiles);

            // Prepare room data
            const roomData = {
                ...data,
                images: imageUrls,
            };

            let response;
            if (isEditMode && selectedRoom) {
                // Update existing room
                response = await updateRoom(selectedRoom._id, roomData);

                if (response.success) {
                    // Delete old images that were replaced
                    const oldImages = selectedRoom.images;
                    const imagesToDelete = oldImages.filter(
                        (oldUrl) => !imageUrls.includes(oldUrl)
                    );
                    if (imagesToDelete.length > 0) {
                        await deleteImages(imagesToDelete);
                    }

                    toast.success("Room updated successfully");
                    setFormDialogOpen(false);
                    fetchRooms();
                } else {
                    // Rollback: delete uploaded images if update failed
                    const newImages = imageUrls.filter(
                        (url) => !selectedRoom.images.includes(url)
                    );
                    if (newImages.length > 0) {
                        await deleteImages(newImages);
                    }
                    toast.error(response.message || "Failed to update room");
                }
            } else {
                // Create new room
                response = await createRoom(roomData);

                if (response.success) {
                    toast.success("Room created successfully");
                    setFormDialogOpen(false);
                    fetchRooms();
                } else {
                    // Rollback: delete uploaded images if create failed
                    await deleteImages(imageUrls);
                    toast.error(response.message || "Failed to create room");
                }
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        if (!selectedRoom) return;

        try {
            setDeleteLoading(true);

            // Delete images first
            await deleteImages(selectedRoom.images);

            // Then delete room
            const response = await deleteRoom(selectedRoom._id);

            if (response.success) {
                toast.success("Room deleted successfully");
                setDeleteDialogOpen(false);
                setSelectedRoom(null);
                fetchRooms();
            } else {
                toast.error(response.message || "Failed to delete room");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred while deleting room");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Format date helper
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM dd, yyyy");
        } catch {
            return dateString;
        }
    };

    // Status badge
    const StatusBadge = ({ status }: { status: RoomStatus }) => {
        const colors = {
            available: "bg-green-500/20 text-green-400 border-green-500/50",
            unavailable: "bg-red-500/20 text-red-400 border-red-500/50",
            maintenance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
        };

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Room type options
    const roomTypeOptions: Option[] = [
        { value: "Single", label: "Single" },
        { value: "Double", label: "Double" },
        { value: "Suite", label: "Suite" },
        { value: "Deluxe", label: "Deluxe" },
        { value: "Presidential", label: "Presidential" },
    ];

    // Status options
    const statusOptions: Option[] = [
        { value: "available", label: "Available" },
        { value: "unavailable", label: "Unavailable" },
        { value: "maintenance", label: "Maintenance" },
    ];

    // Define columns
    const columns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (room: IRoom) => formatDate(room.createdAt),
        },
        {
            key: "roomNumber",
            label: "Room Number",
            render: (room: IRoom) => (
                <span className="font-medium">{room.roomNumber}</span>
            ),
        },
        {
            key: "image",
            label: "Image",
            render: (room: IRoom) => (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    {room.images && room.images.length > 0 ? (
                        <Image
                            src={room.images[0]}
                            alt={room.roomNumber}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                            No Image
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "roomType",
            label: "Room Type",
            render: (room: IRoom) => <span>{room.roomType}</span>,
        },
        {
            key: "capacity",
            label: "Capacity",
            render: (room: IRoom) => <span>{room.capacity}</span>,
        },
        {
            key: "pricePerNight",
            label: "Price Per Night",
            render: (room: IRoom) => (
                <span className="font-medium">${room.pricePerNight.toFixed(2)}</span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (room: IRoom) => <StatusBadge status={room.status} />,
        },
        {
            key: "actions",
            label: "Actions",
            render: (room: IRoom) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(room)}
                        className="h-8 px-2"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(room)}
                        className="h-8 px-2"
                        title="Edit Room"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(room)}
                        className="h-8 px-2"
                        title="Delete Room"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Room Management</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        View and manage all hotel rooms
                    </p>
                </div>
                <Button onClick={handleAddClick} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Room
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={rooms}
                loading={loading}
                emptyMessage="No rooms found."
                pagination={{
                    page: currentPage,
                    totalPages: totalPages,
                    total: totalItems,
                    onPageChange: handlePageChange,
                }}
                selectable={false}
            />

            {/* View Details Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Room Details"
                widthClass="max-w-3xl"
            >
                {selectedRoom && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Room ID</p>
                                <p className="text-sm font-medium">{selectedRoom._id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Status</p>
                                <StatusBadge status={selectedRoom.status} />
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Room Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Room Number</p>
                                    <p className="text-sm font-medium">{selectedRoom.roomNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Room Type</p>
                                    <p className="text-sm font-medium">{selectedRoom.roomType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Capacity</p>
                                    <p className="text-sm font-medium">{selectedRoom.capacity}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Price Per Night</p>
                                    <p className="text-sm font-medium">
                                        ${selectedRoom.pricePerNight.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {selectedRoom.description && (
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-sm font-semibold mb-2">Description</h3>
                                <p className="text-sm text-gray-300">{selectedRoom.description}</p>
                            </div>
                        )}

                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Images</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {selectedRoom.images.map((imageUrl, index) => (
                                    <div
                                        key={index}
                                        className="relative w-full aspect-square rounded-lg overflow-hidden"
                                    >
                                        <Image
                                            src={imageUrl}
                                            alt={`Room ${selectedRoom.roomNumber} - Image ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Created At</p>
                                    <p className="text-sm font-medium">
                                        {formatDate(selectedRoom.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Last Updated</p>
                                    <p className="text-sm font-medium">
                                        {formatDate(selectedRoom.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogBox>

            {/* Add/Edit Form Dialog */}
            <DialogBox
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                title={isEditMode ? "Edit Room" : "Add New Room"}
                widthClass="max-w-2xl"
                showFooter
                confirmText={isEditMode ? "Update Room" : "Create Room"}
                cancelText="Cancel"
                onConfirm={handleSubmit(onSubmit)}
                onCancel={() => setFormDialogOpen(false)}
                disableConfirm={formLoading}
                confirmLoading={formLoading}
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">

                        <InputField
                            name="roomNumber"
                            label="Room Number *"
                            placeholder="e.g., 101"
                            register={register}
                            error={errors.roomNumber}
                            validation={{
                                required: "Room number is required",
                            }}
                        />



                        <SelectField
                            name="roomType"
                            label="Room Type *"
                            options={roomTypeOptions}
                            control={control}
                            required
                            error={errors.roomType}
                        />

                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputField
                                name="capacity"
                                label="Capacity *"
                                type="number"
                                placeholder="e.g., 2"
                                register={register}
                                error={errors.capacity}
                                validation={{
                                    required: "Capacity is required",
                                    min: { value: 1, message: "Capacity must be at least 1" },
                                    valueAsNumber: true,
                                }}
                            />
                        </div>

                        <div>
                            <InputField
                                name="pricePerNight"
                                label="Price Per Night *"
                                type="number"
                                placeholder="e.g., 100.00"
                                register={register}
                                error={errors.pricePerNight}
                                validation={{
                                    required: "Price per night is required",
                                    min: { value: 0, message: "Price cannot be negative" },
                                    valueAsNumber: true,
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <SelectField
                            name="status"
                            label="Status *"
                            options={statusOptions}
                            control={control}
                            required
                            error={errors.status}
                        />
                    </div>

                    <div>
                        <TextAreaField
                            name="description"
                            label="Description"
                            placeholder="Room description (optional)"
                            register={register}
                            error={errors.description}
                            rows={3}
                        />
                    </div>

                    <div>
                        <EdgeStoreUploader
                            maxFiles={4}
                            maxSizeMB={4}
                            value={imageFiles}
                            onChange={setImageFiles}
                            initialUrls={isEditMode ? selectedRoom?.images || [] : []}
                            error={
                                imageFiles.length < 1
                                    ? "At least one image is required"
                                    : undefined
                            }
                        />
                    </div>
                </form>
            </DialogBox>

            {/* Delete Confirmation Dialog */}
            <DialogBox
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Room"
                description={`Are you sure you want to delete room ${selectedRoom?.roomNumber}? This action cannot be undone. All associated images will also be deleted.`}
                showFooter
                confirmText="Delete Room"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteDialogOpen(false)}
                confirmLoading={deleteLoading}
                variant="danger"
            />
        </div>
    );
};

export default RoomsPage;

