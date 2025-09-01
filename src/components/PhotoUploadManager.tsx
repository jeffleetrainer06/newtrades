import { useState, useEffect } from 'react'
import { supabase, VehiclePhoto } from '../lib/supabase'
import { Upload, X, Camera, Image, Smartphone, Share2 } from 'lucide-react'

interface PhotoUploadManagerProps {
  vehicleId: string
}

// Compress image before upload
function compressImage(file: File, maxWidth: number = 1600, quality: number = 0.7): Promise<File> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        console.warn('Canvas context not available, using original file')
        resolve(file)
        return
      }
      
      const img = new Image()
      
      img.onerror = () => {
        console.warn('Image load error, using original file')
        resolve(file)
      }
    
      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          // Also check height and adjust if needed
          const maxHeight = 1200
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              console.warn('Canvas toBlob failed, using original file')
              resolve(file)
            }
          }, 'image/jpeg', quality)
        } catch (error) {
          console.warn('Image compression failed, using original file:', error)
          resolve(file)
        }
      }
    
      img.src = URL.createObjectURL(file)
    } catch (error) {
      console.warn('Image compression setup failed, using original file:', error)
      resolve(file)
    }
  })
}

const PHOTO_TYPES = [
  { id: 'front_corner', label: '1. Passenger Front Corner', required: true },
  { id: 'driver_side', label: '2. Driver\'s Front Corner', required: true },
  { id: 'rear_corner', label: '3. Driver\'s Rear Corner', required: true },
  { id: 'passenger_side', label: '4. Passenger\'s Rear Corner', required: true },
  { id: 'interior_front', label: '5. Interior - Front Seats', required: true },
  { id: 'interior_rear', label: '6. Interior - Rear Seats', required: true },
  { id: 'damage', label: '7. Damage/Scratches/Wear', required: false },
  { id: 'undercarriage', label: 'Undercarriage', required: false },
  { id: 'additional', label: 'Additional', required: false }
] as const

function VehiclePhotoUpload({ vehicleId, slot, onUploadComplete }: { 
  vehicleId: string, 
  slot: string, 
  onUploadComplete: () => void 
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'camera' | 'gallery'>('camera');
  const [compressing, setCompressing] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    
    // Check initial file size - reject if over 20MB
    if (file.size > 50 * 1024 * 1024) {
      alert('Image file is too large (over 50MB). Please take a new photo or select a smaller image.');
      return;
    }
    
    setUploading(true);
    setCompressing(true);
    
    try {
      if (!supabase) {
        alert('Database connection not available. Please check your internet connection and refresh the page.');
        return;
      }

      // More aggressive compression for production
      const compressedFile = await compressImage(file, 1600, 0.7);
      console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Final size check - must be under 10MB for Supabase
      if (compressedFile.size > 10 * 1024 * 1024) {
        // Try ultra compression
        const ultraCompressed = await compressImage(file, 1200, 0.5);
        console.log(`Ultra compressed size: ${(ultraCompressed.size / 1024 / 1024).toFixed(2)}MB`);
        
        if (ultraCompressed.size > 10 * 1024 * 1024) {
          alert('Image is still too large after compression. Please try taking a new photo with your camera instead of selecting from gallery.');
          return;
        }
        
        // Upload ultra compressed version
        await uploadFile(ultraCompressed, slot);
      } else {
        // Upload normally compressed file
        await uploadFile(compressedFile, slot);
      }
      
      setCompressing(false);
      alert('Photo uploaded successfully!');
      setFile(null);
      onUploadComplete();
    } catch (error) {
      alert('Upload failed: ' + (error as Error).message);
    } finally {
      setUploading(false);
      setCompressing(false);
    }
  };

  const uploadFile = async (fileToUpload: File, slot: string) => {
    const fileName = `${slot}_${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vehicle-photos')
      .upload(fileName, fileToUpload, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      throw new Error('Storage upload failed: ' + uploadError.message);
    }
    
    const { data: urlData } = supabase.storage
      .from('vehicle-photos')
      .getPublicUrl(fileName);
    
    // Delete existing photo of this type
    const { error: deleteError } = await supabase
      .from('vehicle_photos')
      .delete()
      .eq('vehicle_id', vehicleId)
      .eq('photo_type', slot)
    
    // Insert new photo record
    const { error: dbError } = await supabase
      .from('vehicle_photos')
      .insert([{
        vehicle_id: vehicleId,
        photo_type: slot,
        photo_url: urlData?.publicUrl || '',
        sort_order: PHOTO_TYPES.findIndex(type => type.id === slot)
      }])
    if (dbError) {
      throw new Error('Database error: ' + dbError.message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Check if file is too large (over 20MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert('Image file is too large (over 50MB). Please try taking a new photo with your camera instead of selecting from gallery.');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-gray-400 transition-colors">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setUploadMode('camera')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMode === 'camera'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="h-4 w-4 mr-1" />
              Camera
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('gallery')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMode === 'gallery'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Image className="h-4 w-4 mr-1" />
              Gallery
            </button>
          </div>
        </div>
        
        {uploadMode === 'camera' ? (
          <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        ) : (
          <Smartphone className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        )}
        
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {slot.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </label>
        
        <p className="text-xs text-gray-500 mb-3">
          {uploadMode === 'camera' 
            ? 'Take a new photo with your camera' 
            : 'Choose from your phone\'s photo gallery'
          }
          <br />
          <span className="text-blue-600">Photos are automatically compressed to reduce file size</span>
        </p>
        
        {file && (
          <div className="mb-2 text-xs text-gray-600">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
            {file.size > 1 * 1024 * 1024 && (
              <div className="text-blue-600 mt-1">
                Large file - will be compressed to under 5MB for upload
              </div>
            )}
          </div>
        )}
        
        <input 
          type="file" 
          onChange={handleFileSelect}
          accept="image/*"
          capture={uploadMode === 'camera' ? "environment" : undefined}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 mb-3"
        />
        
        <button 
          onClick={handleUpload} 
          disabled={uploading || compressing || !file}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium w-full flex items-center justify-center"
        >
          {compressing ? 'Compressing...' : uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>
    </div>
  );
}

export function PhotoUploadManager({ vehicleId }: PhotoUploadManagerProps) {
  const [photos, setPhotos] = useState<VehiclePhoto[]>([])

  useEffect(() => {
    fetchPhotos()
  }, [vehicleId])

  async function fetchPhotos() {
    const { data } = await supabase
      .from('vehicle_photos')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('sort_order')
    
    setPhotos(data || [])
  }

  async function deletePhoto(photoId: string, photoUrl: string) {
    if (confirm('Are you sure you want to delete this photo?')) {
      try {
        const urlParts = photoUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        
        if (fileName) {
          await supabase.storage
            .from('vehicle-photos')
            .remove([fileName])
        }

        await supabase
          .from('vehicle_photos')
          .delete()
          .eq('id', photoId)

        fetchPhotos()
      } catch (error) {
        console.error('Error deleting photo:', error)
        alert('Error deleting photo. Please try again.')
      }
    }
  }

  const getPhotosForType = (type: string) => {
    return photos.filter(p => p.photo_type === type)
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📱 Photo Upload Options:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Camera Mode:</strong> Take new photos directly with your phone camera</li>
          <li>• <strong>Gallery Mode:</strong> Upload photos you've already taken and saved</li>
          <li>• You can switch between modes for each photo type</li>
          <li>• Perfect for uploading photos taken earlier when you get back to your desk</li>
        </ul>
      </div>

      {PHOTO_TYPES.map((type) => {
        const typePhotos = getPhotosForType(type.id)

        return (
          <div key={type.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                {type.label}
                {type.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              <span className="text-sm text-gray-500">
                {typePhotos.length} photo{typePhotos.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {typePhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.photo_url}
                    alt={type.label}
                    className="w-full h-24 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    onClick={() => deletePhoto(photo.id, photo.photo_url)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-75 hover:opacity-100 transition-opacity shadow-md"
                    title="Delete this photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <VehiclePhotoUpload 
              vehicleId={vehicleId} 
              slot={type.id} 
              onUploadComplete={fetchPhotos}
            />
          </div>
        )
      })}
    </div>
  )
}
