import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EncryptedImageMessage = ({ msg, user }) => {
  const [decryptedImage, setDecryptedImage] = useState(null);

  // useEffect(() => {
  //   const decryptImage = async () => {
  //     const content = JSON.parse(msg.content);
  //     console.log("Content:", content);

  //     // Fixing the double "uploads/uploads/"
  //     let correctedShare1 = content.share1.replace('/uploads/uploads/', '/uploads/');
  //     let correctedShare2 = content.share2.replace('/uploads/uploads/', '/uploads/');

  //     // Handling spaces in file names
  //     correctedShare1 = correctedShare1.replace(/\s+/g, '_');
  //     correctedShare2 = correctedShare2.replace(/\s+/g, '_');


  //     // If sender, show original image (before encryption)
  //     if (msg.sender.toLowerCase() === user.address.toLowerCase()) {
  //       setDecryptedImage(`http://localhost:3001${correctedShare2}`);
  //     }
  //     else {
  //       // If receiver, send both shares to backend for reconstruction
  //       try {
  //         const response = await axios.post('http://localhost:3001/api/decrypt-image', {
  //           share1: correctedShare1,
  //           share2: correctedShare2
  //         });

  //         setDecryptedImage(`http://localhost:3001/uploads/${response.data.reconstructedImageUrl}`);
  //         console.log("Decrypted Image URL:", response.data.reconstructedImageUrl);

  //       } catch (err) {
  //         console.error('Decryption failed:', err);
  //       }
  //     }
  //   };

  //   decryptImage();
  // }, [msg, user]);

  useEffect(() => {
    const decryptImage = async () => {
      const content = JSON.parse(msg.content);
      // console.log("Content:", content);
  
      // Fixing the double "uploads/uploads/"
      let correctedShare1 = content.share1.replace('/uploads/uploads/', '/uploads/');
      let correctedShare2 = content.share2.replace('/uploads/uploads/', '/uploads/');
  
      // Check if filenames contain spaces
      if (/\s/.test(correctedShare1) || /\s/.test(correctedShare2)) {
        toast.dismiss(); // Dismiss existing toasts to prevent duplicates
        toast.error("Don't use image names with spaces", { toastId: "image-space-error" });
        return;
      }
  
      // If sender, show original image (before encryption)
      if (msg.sender.toLowerCase() === user.address.toLowerCase()) {
        setDecryptedImage(`http://localhost:3001${correctedShare2}`);
      } else {
        // If receiver, send both shares to backend for reconstruction
        try {
          const response = await axios.post('http://localhost:3001/api/decrypt-image', {
            share1: correctedShare1,
            share2: correctedShare2
          });
  
          setDecryptedImage(`http://localhost:3001/uploads/${response.data.reconstructedImageUrl}`);
          // console.log("Decrypted Image URL:", response.data.reconstructedImageUrl);
  
        } catch (err) {
          console.error('Decryption failed:', err);
        }
      }
    };
  
    decryptImage();
  }, [msg, user]);
  
  return (
    <div>
      {decryptedImage ? (
        <img src={decryptedImage} alt="Decrypted" className="max-w-full h-auto rounded" />
      ) : (
        <p>Decrypting image...</p>
      )}
    </div>
  );
};

export default EncryptedImageMessage;
