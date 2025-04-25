import { useAuth } from '@/contexts/AuthContext';
import { contactInfoSchema, personalInfoSchema, skillsSchemn, userSchema } from '@/schema/users';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { Form, Tab, Tabs } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PersonalForm from './tabs-form/PersonalForm';
import FormDebug from '@/components/Form/FormDebug';
import ContactForm from './tabs-form/ContactForm';
import SkillsForm from './tabs-form/SkillsForm';
import {
  createUserWithEmailAndPassword,
  EmailAuthCredential,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, firebaseConfig, storage } from '@/firebase';
import { initializeApp } from 'firebase/app';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

const UserForm = ({ data, isProfile = false }) => {
  const auth = useAuth();

  const router = useRouter();

  const tabsLength = 2;
  const tabSchema = [personalInfoSchema, contactInfoSchema, skillsSchemn];

  const [isLoading, setIsLoading] = useState(false);
  const [activeKey, setActiveKey] = useState('0');

  const [file, setFile] = useState(null);

  const schema = useMemo(() => {
    return tabSchema[Number(activeKey)] ?? personalInfoSchema;
  }, [activeKey]);

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      ...getFormDefaultValues(schema),
      ...data,
      categories: [],
    },
    resolver: zodResolver(schema),
  });

  const formErrors = form.formState.errors;

  const handleOnSelect = async (key) => {
    const isValid = await form.trigger();
    if (!isValid && activeKey !== key) {
      toast.error('Please fix the errors in the form and try again.', { position: 'top-right' });
      return;
    }

    setActiveKey(key);
  };

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (Number(activeKey) <= tabSchema.length - 1) {
      const nextActiveKey = String(Number(activeKey) + 1);
      setActiveKey(nextActiveKey);

      if (Number(activeKey) === tabSchema.length - 1) {
        const parseData = userSchema.safeParse(form.getValues());

        if (parseData.success) {
          handleSubmit(parseData.data);
        } else toast.error('Failed to parse data. Please try again later.');
      }
    }
  }, [activeKey]);

  const handlePrevious = useCallback(() => {
    if (Number(activeKey) > 0) handleOnSelect(activeKey - 1);
  }, [activeKey]);

  const handleSubmit = useCallback(
    async (formData) => {
      try {
        setIsLoading(true);

        //* create secondary firebase app and auth to manage diffrence instance of user
        const secondaryFirebaseApp = initializeApp(firebaseConfig, 'secondary-app');
        const secondaryAuth = getAuth(secondaryFirebaseApp);

        let profilePictureUrl = form.getValues('profilePicture');

        //* if no data means creating new user
        if (!data) {
          const { user } = await createUserWithEmailAndPassword(
            secondaryAuth,
            formData.email,
            formData.password
          );

          //* sign out user, because createUserWithEmailAndPassword will sign in user after creation
          await signOut(secondaryAuth);

          if (user) {
            const fullName = `${formData.firstName}${
              formData.middleName ? ` ${formData.middleName}` : ''
            } ${formData.lastName}`;

            const userData = {
              uid: user.uid,
              ...formData,
              fullName,
              profilePicture: profilePictureUrl,
              createdAt: serverTimestamp(),
              createdBy: auth.currentUser,
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            };

            //* if file exists, upload to firebase storage
            if (file) {
              const storageRef = ref(storage, `profile_pictures/${user.uid}`);
              const uploadedFile = await uploadBytes(storageRef, file);
              const url = await getDownloadURL(uploadedFile.ref);
              profilePictureUrl = url;
            }

            await setDoc(doc(db, 'users', user.uid), userData);

            if (isProfile) {
              window.location.assign(`/profile/${user.uid}`);
              return;
            }

            window.location.assign(`/workers/edit-workers/${user.uid}`); //TODO: (temporary) change the url of workers to users if allowed
            return;
          }

          toast.error('Error creating user. Please try again later.');
          setIsLoading(false);
          setActiveKey((prev) => prev - 1);
          return;
        }

        //* if reach this far means, data exist which means updating user

        const { user } = await signInWithEmailAndPassword(secondaryAuth, data.email, data.password);

        if (user) {
          //* update firebase auth user email & password

          //* update email
          await updateEmail(user, formData.email);
          const credetials1 = EmailAuthProvider.credential(formData.email, data.password);
          await reauthenticateWithCredential(user, credetials1);

          //* update password
          await updatePassword(user, formData.password);
          const credetials2 = EmailAuthProvider.credential(formData.email, formData.password);
          await reauthenticateWithCredential(user, credetials2);

          const fullName = `${formData.firstName}${
            formData.middleName ? ` ${formData.middleName}` : ''
          } ${formData.lastName}`;

          const userData = {
            ...formData,
            fullName,
            profilePicture: profilePictureUrl,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          };

          //* if file exists, upload to firebase storage
          if (file) {
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            const uploadedFile = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(uploadedFile.ref);
            profilePictureUrl = url;
          }

          if (isProfile) {
            window.location.assign(`/profile/${user.uid}`);
            return;
          }

          await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
          window.location.assign(`/workers/edit-workers/${user.uid}`); //TODO: (temporary) change the url of workers to users if allowed
          return;
        }

        toast.error('Error updating user. Please try again later.');
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
      } catch (error) {
        console.error('Error submitting user:', error);
        toast.error('Something went wrong. Please try again later.');
        setIsLoading(false);
        setActiveKey((prev) => prev - 1);
      }
    },
    [data, file, form.watch('profilePicture')]
  );

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form>
          <Tabs
            id='calibration-tab'
            activeKey={activeKey > tabsLength ? tabsLength : activeKey}
            onSelect={handleOnSelect}
          >
            <Tab eventKey='0' title='Personal'>
              <PersonalForm
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                setFile={setFile}
              />
            </Tab>

            <Tab eventKey='1' title='Contact'>
              <ContactForm
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>

            <Tab eventKey='2' title='Skills'>
              <SkillsForm
                data={data}
                isLoading={isLoading}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            </Tab>
          </Tabs>
        </Form>
      </FormProvider>
    </>
  );
};

export default UserForm;
