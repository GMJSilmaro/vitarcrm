import { Pencil, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Image } from 'react-bootstrap';
import styles from './AvatarChooser.module.css';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { storage } from '@/firebase';
import { listAll, ref, getDownloadURL } from 'firebase/storage';

const AvatarList = ({ avatars, setProfilePicture, setIsSelectedPredefinedAvatar, setFile }) => {
  const imageInputRef = useRef(null);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      setFile(selectedFile);
      setIsSelectedPredefinedAvatar(false);
    }
  };

  const handleSelectPredefinedAvatar = (avatar) => {
    setProfilePicture(avatar);
    setIsSelectedPredefinedAvatar(true);
  };

  return (
    <div>
      <div
        className='d-flex flex-wrap row-gap-3 column-gap-2 justify-content-between px-2'
        style={{ maxHeight: '300px', overflowY: 'auto' }}
      >
        {/* avatars */}
        <div className='avatar-item'>
          <input
            type='file'
            accept='image/*'
            ref={imageInputRef}
            onChange={handleImageChange}
            style={{ display: 'none' }}
            id='image-input'
          />

          <div
            className={styles.avatarItemUpload}
            onClick={() => imageInputRef && imageInputRef.current?.click()}
          >
            <Upload size={16} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* pre define avatars */}
        {avatars.map((avatar, index) => (
          <Image
            className={styles.avatarItemImage}
            src={avatar}
            alt={`avatar-${index}`}
            key={index}
            width={75}
            height={75}
            onClick={() => handleSelectPredefinedAvatar(avatar)}
          />
        ))}
      </div>
    </div>
  );
};

const AvatarChooser = ({
  originalProfilePicture,
  profilePicture,
  setProfilePicture,
  setIsSelectedPredefinedAvatar,
  setFile,
}) => {
  const [avatars, setAvatars] = useState([]);

  const fetchAvatars = async () => {
    const avatarRef = ref(storage, 'avatars');

    try {
      const avatarData = await listAll(avatarRef);

      const urlsPromises = avatarData.items.map((item) => getDownloadURL(item));
      const urls = await Promise.all(urlsPromises);

      setAvatars(urls);
    } catch (error) {
      Swal.showValidationMessage('Error fetching avatars');
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  const showSwal = useCallback(() => {
    withReactContent(Swal)
      .fire({
        title: 'Choose an Avatar',
        showCancelButton: true,
        html: (
          <AvatarList
            avatars={avatars}
            setAvatars={setAvatars}
            setProfilePicture={setProfilePicture}
            setFile={setFile}
            setIsSelectedPredefinedAvatar={setIsSelectedPredefinedAvatar}
          />
        ),
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Confirm',
      })
      .then((data) => {
        if (data.isConfirmed) {
          Swal.close();
          return;
        }

        if (data.isDismissed) {
          if (originalProfilePicture !== profilePicture) {
            setProfilePicture(profilePicture);
          } else {
            setProfilePicture(originalProfilePicture);
          }
          Swal.close();
        }
      });
  }, [Swal, profilePicture, originalProfilePicture, avatars]);

  return (
    <Button className='py-1 px-2' size='small' onClick={() => showSwal()}>
      <Pencil size={14} style={{ cursor: 'pointer' }} />
    </Button>
  );
};

export default AvatarChooser;
