import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const DEFAULT_ASPECT_RATIO = 16 / 9;

export default function ImageCropper({ imageFile, onCropComplete, onCancel, aspectRatio = DEFAULT_ASPECT_RATIO }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 100,
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(crop);
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    const outputWidth = completedCrop.width * scaleX;
    const outputHeight = outputWidth / aspectRatio;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputWidth,
      outputHeight
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        
        const croppedFile = new File([blob], 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        onCropComplete(croppedFile);
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <div className="image-cropper-container">
      <div className="image-cropper-modal">
        <h3>Crop Image</h3>
        <p>Select crop area ({aspectRatio === 1 ? '1:1' : aspectRatio === 16/9 ? '16:9' : `${aspectRatio.toFixed(2)}:1`} ratio)</p>
        
        {imageSrc && (
          <div className="crop-wrapper">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              className="react-crop"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Image to be cropped"
                onLoad={onImageLoad}
                className="crop-image"
              />
            </ReactCrop>
          </div>
        )}
        
        <div className="image-cropper-controls">
          <button 
            className="btn-cancel" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="btn-accept" 
            onClick={handleCropComplete}
          >
            Accept
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .image-cropper-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .image-cropper-modal {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          width: 100%;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .crop-wrapper {
          width: 100%;
          overflow: hidden;
          margin: 20px 0;
        }
        
        .react-crop {
          width: 100%;
          height: auto;
        }
        
        .crop-image {
          max-width: 100%;
          height: auto;
          max-height: 60vh;
          object-fit: contain;
        }
        
        .image-cropper-controls {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          gap: 10px;
        }
        
        button {
          padding: 12px 24px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          flex: 1;
          font-size: 16px;
          touch-action: manipulation;
        }
        
        .btn-accept {
          background-color: #4caf50;
          color: white;
        }
        
        .btn-cancel {
          background-color: #f44336;
          color: white;
        }

        @media (max-width: 768px) {
          .image-cropper-container {
            padding: 10px;
          }
          
          .image-cropper-modal {
            padding: 15px;
          }
          
          h3 {
            font-size: 18px;
            margin: 0 0 10px 0;
          }
          
          p {
            font-size: 14px;
            margin: 0 0 15px 0;
          }
          
          .crop-image {
            max-height: 50vh;
          }
          
          button {
            padding: 10px 20px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
} 