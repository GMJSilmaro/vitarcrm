import Checkbox from '@/components/common/Checkbox';
import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import SignatureField from '@/components/common/SignaturePad';
import { TooltipContent } from '@/components/common/ToolTipContent';
import FormDebug from '@/components/Form/FormDebug';
import { RequiredLabel } from '@/components/Form/RequiredLabel';
import Select from '@/components/Form/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { useNotifications } from '@/hooks/useNotifications';
import { PRIORITY_LEVELS_COLOR, SCOPE_TYPE_COLOR, STATUS_COLOR } from '@/schema/job';
import { customerNotificationSchema } from '@/schema/job-cn';
import { getFormDefaultValues } from '@/utils/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from 'react-bootstrap';
import { Lightbulb, Save } from 'react-bootstrap-icons';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

const JobCnForm = ({ data, isAdmin = true }) => {
  const router = useRouter();
  const { jobId: jobIdFromUrl, workerId } = router.query;
  const auth = useAuth();
  const notifications = useNotifications();

  const columnHelper = createColumnHelper();

  const [isLoading, setIsLoading] = useState(false);

  const [jobOptions, setJobOptions] = useState({ data: [], isLoading: true, isError: false });

  const [jobCns, setJobCns] = useState({ data: [], isLoading: true, isError: false });
  const [calibrations, setCalibrations] = useState({ data: [], isLoading: false, isError: false }); //prettier-ignore
  const [customerEquipments, setCustomerEquipments] = useState({ data: [], isLoading: false, isError: false }); //prettier-ignore
  const [usersOptions, setUsersOptions] = useState({ data: [], isLoading: true, isError: false }); //prettier-ignore

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      ...getFormDefaultValues(customerNotificationSchema),
      calibrationItems: [],
      ...data,
    },
    resolver: zodResolver(customerNotificationSchema),
  });

  const formErrors = form.formState.errors;

  const jobId = useWatch({ name: 'jobId', control: form.control });
  const cnId = useWatch({ name: 'cnId', control: form.control });
  const customerId = useWatch({ name: 'jobId.customerId', control: form.control });
  const customerName = useWatch({ name: 'jobId.customerName', control: form.control });
  const workers = useWatch({ name: 'jobId.workers', control: form.control });
  const to = useWatch({ name: 'to', control: form.control });
  const pic = useWatch({ name: 'jobId.pic', control: form.control });
  const telFax = useWatch({ name: 'jobId.telFax', control: form.control });
  const isOthers = useWatch({ name: 'isOthers', control: form.control });
  const forVitarLabUseIsOthers = useWatch({ name: 'forVitarLabUseIsOthers', control: form.control }); //prettier-ignore

  const workerOptions = useMemo(() => {
    if (usersOptions.data.length > 0 && workers?.length > 0) {
      const workersIds = workers.map((worker) => worker.id);
      return usersOptions.data.filter((user) => workersIds.includes(user.id));
    }
    return [];
  }, [JSON.stringify(usersOptions), JSON.stringify(workers)]);

  const adminSupervisorOptions = useMemo(() => {
    if (usersOptions.data.length > 0) {
      return usersOptions.data.filter(
        (user) => user.role === 'supervisor' || user.role === 'admin'
      );
    }
    return [];
  }, [JSON.stringify(usersOptions)]);

  const calibratedInstruments = useMemo(() => {
    if (
      !calibrations ||
      calibrations.isLoading ||
      calibrations?.data?.length < 1 ||
      !customerEquipments ||
      customerEquipments.isLoading ||
      customerEquipments?.data?.length < 1
    ) {
      return [];
    }

    return (
      calibrations?.data
        ?.map((c, i) => {
          const eqData = customerEquipments?.data?.find((eq) => c?.description?.id === eq?.id);

          if (eqData) {
            return {
              calibrateId: c.id,
              certificateNumber: c.certificateNumber,
              equipmentId: eqData.id,
              description: eqData.description,
              serialNumber: eqData.serialNumber,
              make: eqData.make,
              model: eqData.model,
            };
          }
        })
        .filter(Boolean) || []
    );
  }, [JSON.stringify(calibrations), JSON.stringify(customerEquipments)]);

  const calibrationItems = useMemo(() => {
    const value = form.getValues('calibrationItems') || [];

    if (!value || (Array.isArray(value) && value.length < 1)) return [];
    return value;
  }, [JSON.stringify(form.watch('calibrationItems'))]);

  const handleSelectRow = (row, table) => {
    const calibrationItem = row.original;
    const index = row.index;
    const isSelected = calibrationItem.isSelected;
    const cnCalibrationItemsData = table.getRowModel()?.rows?.map((row) => row?.original) || [];

    let newCnCalibrationItem;
    const newArray = [...cnCalibrationItemsData];

    //* if is selected then reset the inpection result (e.g. broken, in operative, require accessories, etc)
    //* otherwise set isSelected to true and retain the inpection result
    if (isSelected) {
      newCnCalibrationItem = {
        ...calibrationItem,
        isBroken: false,
        isInOperative: false,
        isRequireAccessories: false,
        others: '',
        isSelected: false,
      };
    } else {
      newCnCalibrationItem = {
        ...calibrationItem,
        isSelected: true,
      };

      form.clearErrors('calibrationItems');
    }

    newArray.splice(index, 1, newCnCalibrationItem);
    form.setValue('calibrationItems', newArray);
  };

  const handleSelectAllRow = (table) => {
    let newArray;

    const calibrationItemsData = table.getRowModel()?.rows?.map((row) => row?.original) || [];

    const isAllSelected = calibrationItemsData.every((cn) => cn.isSelected);

    //* if isAllSelected then reset the inpection result (e.g. broken, in operative, require accessories, etc)
    //* otherwise set isSelected to true and retain the inpection result
    if (isAllSelected) {
      newArray = calibrationItemsData.map((ci) => ({
        ...ci,
        isBroken: false,
        isInOperative: false,
        isRequireAccessories: false,
        others: '',
        isSelected: false,
      }));
    } else {
      newArray = calibrationItemsData.map((ci) => ({ ...ci, isSelected: true }));
      form.clearErrors('calibrationItems');
    }

    form.setValue('calibrationItems', newArray);
  };

  const getIsSomeRowSelected = (table) => {
    const calibrationItemsData = table.getRowModel()?.rows?.map((row) => row?.original) || [];
    if (!calibrationItemsData || calibrationItemsData?.length < 1) return false;

    return (
      calibrationItemsData.some((cn) => cn.isSelected) &&
      !calibrationItemsData.every((cn) => cn.isSelected)
    );
  };

  const getIsAllRowSelected = (table) => {
    const calibrationItemsData = table.getRowModel()?.rows?.map((row) => row?.original) || [];
    if (!calibrationItemsData || calibrationItemsData?.length < 1) return false;

    return calibrationItemsData.every((cn) => cn.isSelected);
  };

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('select', {
        size: 50,
        header: ({ table }) => {
          return (
            <Checkbox
              checked={getIsAllRowSelected(table)}
              indeterminate={getIsSomeRowSelected(table)}
              onChange={() => {
                handleSelectAllRow(table);
              }}
            />
          );
        },
        cell: ({ row, table }) => {
          const isSelected = row.original?.isSelected;
          return (
            <div className='px-1'>
              <Checkbox
                checked={isSelected}
                indeterminate={isSelected}
                onChange={() => {
                  handleSelectRow(row, table);
                }}
              />
            </div>
          );
        },
      }),
      columnHelper.accessor('index', {
        id: 'index',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        enableSorting: false,
        size: 50,
        cell: ({ row, table }) => (
          <div>
            {(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) ||
              0) + 1}
          </div>
        ),
      }),
      columnHelper.accessor('certificateNumber', {
        id: 'cert no',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Cert No.' />,
      }),
      columnHelper.accessor('description', {
        id: 'instrument name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Intrument Name' />,
      }),
      columnHelper.accessor('serialNumber', {
        id: 'serial no',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial No.' />,
      }),
      columnHelper.accessor('make', {
        id: 'maker / manufacturer',
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            Maker /<br /> Manufacturer
          </DataTableColumnHeader>
        ),
      }),
      columnHelper.accessor('model', {
        id: 'model',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Model' />,
      }),
      columnHelper.accessor('isBroken', {
        size: 50,
        filterFn: 'equalsString',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Broken' />,
        cell: ({ row }) => {
          const index = row.index;
          const isSelected = row.original?.isSelected;

          return (
            <Controller
              name={`calibrationItems.${index}.isBroken`}
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  disabled={!isSelected}
                  checked={field.value}
                  type='checkbox'
                />
              )}
            />
          );
        },
      }),
      columnHelper.accessor('isInOperative', {
        size: 50,
        filterFn: 'equalsString',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Inoperative' />,
        cell: ({ row }) => {
          const index = row.index;
          const isSelected = row.original?.isSelected;

          return (
            <Controller
              name={`calibrationItems.${index}.isInOperative`}
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  disabled={!isSelected}
                  checked={field.value}
                  type='checkbox'
                />
              )}
            />
          );
        },
      }),
      columnHelper.accessor('isRequireAccessories', {
        size: 50,
        filterFn: 'equalsString',
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            Require <br /> Accessories
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const index = row.index;
          const isSelected = row.original?.isSelected;

          return (
            <Controller
              name={`calibrationItems.${index}.isRequireAccessories`}
              control={form.control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  disabled={!isSelected}
                  checked={field.value}
                  type='checkbox'
                />
              )}
            />
          );
        },
      }),

      columnHelper.accessor('others', {
        size: 200,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Others' />,
        cell: ({ row }) => {
          const index = row.index;
          const isSelected = row.original?.isSelected;

          return (
            <Controller
              name={`calibrationItems.${index}.others`}
              control={form.control}
              render={({ field }) => (
                <>
                  <Form.Control
                    className='text-center'
                    {...field}
                    disabled={!isSelected}
                    onChange={(e) => field.onChange(e.target.value)}
                    type='text'
                  />
                </>
              )}
            />
          );
        },
      }),
    ];
  }, []);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Cert No',
        columnId: 'cert no',
        type: 'text',
        placeholder: 'Search by cert no...',
      },
      {
        label: 'Instrument Name',
        columnId: 'instrument name',
        type: 'text',
        placeholder: 'Search by instrument name...',
      },
      {
        label: 'Serial No',
        columnId: 'serial no',
        type: 'text',
        placeholder: 'Search by serial no...',
      },
      {
        label: 'Maker / Manufacturer',
        columnId: 'maker / manufacturer',
        type: 'text',
        placeholder: 'Search by maker / manufacturer...',
      },
      {
        label: 'Model',
        columnId: 'model',
        type: 'text',
        placeholder: 'Search by model...',
      },
      {
        label: 'Broken',
        columnId: 'isBroken',
        type: 'select',
        options: [
          { label: 'N/A', value: '' },
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
      {
        label: 'Inoperative',
        columnId: 'isInOperative',
        type: 'select',
        options: [
          { label: 'N/A', value: '' },
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
      {
        label: 'Require Accessories',
        columnId: 'isRequireAccessories',
        type: 'select',
        options: [
          { label: 'N/A', value: '' },
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
      {
        label: 'Others',
        columnId: 'others',
        type: 'text',
        placeholder: 'Search by others...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: calibrationItems,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const formData = form.getValues();

      try {
        const isValid = await form.trigger();
        const parseData = customerNotificationSchema.safeParse(formData);

        if ((!parseData.success && !parseData.data) || !isValid) {
          toast.error('Please fix the errors in the form and try again.', {
            position: 'top-right',
          });

          return;
        }

        setIsLoading(true);

        const actualFormData = parseData.data;

        //* upsert job customer notification
        await setDoc(
          doc(db, 'jobCustomerNotifications', actualFormData.cnId),
          {
            ...actualFormData,
            ...(!data && { createdAt: serverTimestamp(), createdBy: auth.currentUser }),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          },
          { merge: true }
        );

        if (!data) {
          //* create notification for admin and supervisor when created a job cn
          await notifications.create({
            module: 'job-cn',
            target: ['admin', 'supervisor'],
            title: 'New job customer notification created',
            message: `
             A new job customer notification (#${actualFormData.cnId}) has been created by ${auth.currentUser.displayName} for job (#${actualFormData.jobId}).`,
            data: {
              redirectUrl: `/job-cns/view/${actualFormData.cnId}`,
            },
          });
        } else {
          await notifications.create({
            module: 'job-cn',
            target: ['admin', 'supervisor'],
            title: 'Job customer notification updated',
            message: `
             A job customer notification (#${actualFormData.cnId}) has been updated by ${auth.currentUser.displayName} for job (#${actualFormData.jobId}).`,
            data: {
              redirectUrl: `/job-cns/view/${actualFormData.cnId}`,
            },
          });
        }

        toast.success(`Job customer notification #${actualFormData.cnId} ${data ? 'updated' : 'created'} successfully.`, {position: 'top-right'}); // prettier-ignore
        setIsLoading(false);

        if (isAdmin) {
          setTimeout(() => {
            window.location.assign(`/job-cns/view/${actualFormData.cnId}`);
          }, 1500);
        } else {
          setTimeout(() => {
            window.location.assign(`/user/${workerId}/job-cns/view/${actualFormData.cnId}`);
          }, 1500);
        }
      } catch (error) {
        console.error('Error submitting job customer notification:', error);
        toast.error('Something went wrong. Please try again later.');
      }
    },
    [data]
  );

  const formatJobOptionLabel = (data) => {
    const scope = data?.scope;
    const priority = data?.priority;
    const status = data?.status;

    return (
      <div className='d-flex justify-content-between align-items-center gap-2 text-capitalize'>
        <span>{data.label}</span>

        <span className='d-flex column-gap-2'>
          {scope && (
            <Badge className='text-capitalize' bg={SCOPE_TYPE_COLOR[scope] || 'secondary'}>
              {scope}
            </Badge>
          )}

          {priority && (
            <Badge className='text-capitalize' bg={PRIORITY_LEVELS_COLOR[priority] || 'secondary'}>
              {priority}
            </Badge>
          )}

          {status && <Badge bg={STATUS_COLOR[status] || 'secondary'}>{_.startCase(status)}</Badge>}
        </span>
      </div>
    );
  };

  const handleJobIdChange = useCallback(
    (option, field) => {
      field.onChange(option);

      //* if create then jobId changed clear worker
      if (!data) form.setValue('worker', null);
      else {
        //* if edit then jobId changed clear worker if jobId is different
        //* else set worker if jobId is same
        if (data?.jobId !== option?.value) form.setValue('worker', null);
        else {
          const worker = workerOptions.find((w) => w.value === data?.worker);
          form.setValue('worker', worker ?? null);
        }
      }
    },
    [data, workerOptions]
  );

  //* query jobs that dont have job cn
  useEffect(() => {
    //TODO: filter based on status
    const q = query(
      collection(db, 'jobHeaders'),
      where('status', 'in', ['job-in-progress', 'job-validation', 'job-complete'])
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          setJobOptions({ data: [], isLoading: false, isError: false });
          return;
        }

        const jobDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const promises = jobDocs.map(async (job) => {
          try {
            const jobDetailsPromise = getDoc(doc(db, 'jobDetails', job.id));

            const [jobDetailsDoc] = await Promise.all([jobDetailsPromise]);

            return {
              ...job,
              details: jobDetailsDoc.exists() ? jobDetailsDoc.data() : null,
            };
          } catch (error) {
            console.error(error);
            return null;
          }
        });

        const settledResults = await Promise.allSettled(promises);

        const validJobs = settledResults
          .filter((result) => result.status === 'fulfilled' && result.value !== null)
          .map((result) => result.value);

        const jobsWithNoAssociatedJobCn = validJobs.filter((job) => {
          if (data && job.id === data?.jobId) return true;

          const isAssociatedJobCn = jobCns.data.some((jcn) => jcn.jobId === job.id);
          return !isAssociatedJobCn;
        });

        const options = jobsWithNoAssociatedJobCn.map((job) => ({
          id: job.id,
          value: job.id,
          label: `${job.id} - ${job?.customer?.name}`,
          status: job.status,
          priority: job.priority,
          scope: job.scope,
          calibrationItems: job?.details?.customerEquipments || [],
          customerId: job?.customer?.id,
          customerName: job?.customer?.name,
          workers: job?.workers || [],
        }));

        setJobOptions({
          data: options,
          isLoading: false,
          isError: false,
        });
      },
      (err) => {
        console.error(err.message);
        setJobOptions({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, [JSON.stringify(jobCns), data]);

  //* query job cns
  useEffect(() => {
    const q = query(collection(db, 'jobCustomerNotifications'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const jobCnsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setJobCns({
            data: jobCnsData,
            isLoading: false,
            isError: false,
          });

          return;
        }

        setJobCns({
          data: [],
          isLoading: false,
          isError: false,
        });
      },
      (err) => {
        console.error(err.message);
        setJobCns({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  //* query calibrations based on chosen job
  useEffect(() => {
    if (!jobId || !jobId?.id) {
      setCalibrations({ data: [], isLoading: false, isError: false });
      return;
    }

    setCalibrations((prev) => ({ ...prev, isLoading: true }));

    //TODO: filter based on status
    const q = query(collection(db, 'jobCalibrations'), where('jobId', '==', jobId.id));

    getDocs(q)
      .then((snapshot) => {
        if (snapshot.empty) {
          setCalibrations({ data: [], isLoading: false, isError: false });
          return;
        }

        const calibrationDocs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCalibrations({
          data: calibrationDocs,
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setCalibrations({ data: [], isLoading: false, isError: true });
      });
  }, [JSON.stringify(jobId)]);

  //* query customer equipments
  useEffect(() => {
    if (!customerId) {
      setCustomerEquipments({ data: [], isLoading: false, isError: false });
      return;
    }

    setCustomerEquipments((prev) => ({ ...prev, isLoading: true }));

    const q = query(collection(db, 'customerEquipments'), where('customerId', '==', customerId));

    getDocs(q)
      .then((snapshot) => {
        if (snapshot.empty) {
          setCustomerEquipments({ data: [], isLoading: false, isError: false });
          return;
        }

        const ceDocs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCustomerEquipments({
          data: ceDocs,
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setCustomerEquipments({ data: [], isLoading: false, isError: true });
      });
  }, [customerId]);

  //* query users
  useEffect(() => {
    const q = query(collection(db, 'users'));

    getDocs(q)
      .then((snapshot) => {
        if (snapshot.empty) {
          setUsersOptions({ data: [], isLoading: false, isError: false });
          return;
        }

        const userDocs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const options = userDocs.map((user) => ({
          uid: user.id,
          id: user.workerId,
          name: user.fullName,
          value: user.id,
          label: user.fullName,
          role: user.role,
          signature: user?.signature || '',
        }));

        setUsersOptions({
          data: options,
          isLoading: false,
          isError: false,
        });
      })
      .catch((err) => {
        console.error(err.message);
        setUsersOptions({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* set jobId if jobIdFromUrl exists
  useEffect(() => {
    if (jobIdFromUrl && jobOptions.data.length > 0) {
      const job = jobOptions.data.find((option) => option.value === jobIdFromUrl);
      if (job) form.setValue('jobId', job);
    }
  }, [jobIdFromUrl, JSON.stringify(jobOptions)]);

  //* set jobId if data exists
  useEffect(() => {
    if (data && jobOptions.data.length > 0) {
      const job = jobOptions.data.find((option) => option.value === data?.jobId);
      if (job) form.setValue('jobId', job);
    }
  }, [data, JSON.stringify(jobOptions)]);

  //* set worker if data exists
  useEffect(() => {
    if (data && workerOptions.length > 0) {
      const worker = workerOptions.find((option) => option.value === data?.worker);
      if (worker) form.setValue('worker', worker);
    }
  }, [data, JSON.stringify(workerOptions)]);

  //* set forVitarLabUseAuthorizeBy if data exists
  useEffect(() => {
    if (data && adminSupervisorOptions.length > 0) {
      const supervisor = adminSupervisorOptions.find((option) => option.value === data?.forVitarLabUseAuthorizeBy); //prettier-ignore
      if (supervisor) {
        form.setValue('forVitarLabUseAuthorizeBy', supervisor);
      }
    }
  }, [data, JSON.stringify(adminSupervisorOptions)]);

  //* set calibrationItems
  useEffect(() => {
    if (!data && calibratedInstruments?.length > 0) {
      const items = calibratedInstruments.map((item) => ({
        ...item,
        isBroken: false,
        isInOperative: false,
        isRequireAccessories: false,
        others: '',
        isSelected: false,
      }));

      form.setValue('calibrationItems', items);
      return;
    }

    if (data && calibratedInstruments?.length > 0) {
      const cnCalibrationItems = data?.calibrationItems || [];

      if (cnCalibrationItems?.length < 1) {
        const items = calibratedInstruments.map((item) => ({
          ...item,
          isBroken: false,
          isInOperative: false,
          isRequireAccessories: false,
          others: '',
          isSelected: false,
        }));

        form.setValue('calibrationItems', items);
        return;
      }

      //* find item from calibratedInstruments if found use its data
      //* did this to make customer equipment data up to date
      const currentCnCalibrationItems = calibratedInstruments.map((ci) => {
        const cnItem = cnCalibrationItems.find((cn) => cn.equipmentId === ci.equipmentId);

        if (cnItem) return { ...cnItem, ...ci };

        return {
          ...ci,
          isBroken: false,
          isInOperative: false,
          isRequireAccessories: false,
          others: '',
          isSelected: false,
        };
      });

      form.setValue('calibrationItems', currentCnCalibrationItems);
      return;
    }

    form.setValue('calibrationItems', []);
  }, [JSON.stringify(calibratedInstruments), data]);

  //* set cnId
  useEffect(() => {
    if (!jobId || !jobId?.id) return;

    const numericPart = String(jobId.id).replace('J', '');
    const yearLastTwoDigits = new Date().getFullYear().toString().slice(-2);
    form.setValue('cnId', `CN${yearLastTwoDigits}-${numericPart}`);
  }, [JSON.stringify(jobId)]);

  //* set others as '' if isOthers is false
  useEffect(() => {
    if (!isOthers) form.setValue('others', '');
  }, [isOthers]);

  //* set forVitarLabUseOthers as '' if forVitarLabUseIsOthers is false
  useEffect(() => {
    if (!forVitarLabUseIsOthers) form.setValue('forVitarLabUseOthers', '');
  }, [forVitarLabUseIsOthers]);

  //* to default to pic,
  useEffect(() => {
    if (pic) form.setValue('to', pic);
    else form.setValue('to', data?.to || '');
  }, [data, pic]);

  //* faxNo default to telFax,
  useEffect(() => {
    if (telFax) form.setValue('faxNo', telFax);
    else form.setValue('faxNo', data?.faxNo || '');
  }, [data, pic]);

  //* automatically set worker if workerId exists
  useEffect(() => {
    if (!data && workerId && workerOptions.length > 0 && jobId) {
      const worker = workerOptions.find((option) => option.id === workerId);
      form.setValue('worker', worker);
    }
  }, [workerId, JSON.stringify(workerOptions), JSON.stringify(jobId)]);

  return (
    <>
      {/* <FormDebug form={form} /> */}

      <FormProvider {...form}>
        <Form onSubmit={handleSubmit}>
          <Card className='shadow-none'>
            <Card.Body className='pb-0'>
              <h4 className='mb-0'>Job</h4>
              <p className='text-muted fs-6'>Associate job for job customer notification.</p>

              <Row>
                <Form.Group as={Col} md={12}>
                  <RequiredLabel label='Job' id='jobId' />

                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip>
                        <TooltipContent
                          title='Job Search'
                          info={[
                            "Search by job's id or customer name",
                            'Selection will load related job calibrated instruments',
                            'Required to proceed with job customer notification creation',
                          ]}
                        />
                      </Tooltip>
                    }
                  >
                    <i className='fe fe-help-circle text-muted' style={{ cursor: 'pointer' }} />
                  </OverlayTrigger>

                  <Controller
                    name='jobId'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Select
                          {...field}
                          inputId='jobId'
                          instanceId='jobId'
                          onChange={(option) => handleJobIdChange(option, field)}
                          formatOptionLabel={formatJobOptionLabel}
                          options={jobOptions.data}
                          isLoading={jobOptions.isLoading}
                          placeholder={
                            jobOptions.isLoading
                              ? 'Loading jobs...'
                              : "Search by job's id or customer name"
                          }
                          isDisabled={jobOptions.isLoading || !!workerId}
                          noOptionsMessage={() =>
                            jobOptions.isLoading ? 'Loading...' : 'No jobs found'
                          }
                        />

                        {formErrors && formErrors.jobId?.message && (
                          <Form.Text className='text-danger'>{formErrors.jobId?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>
              </Row>

              <hr className='my-4' />
              <h4 className='mb-0'>Customer Notification Info</h4>
              <p className='text-muted fs-6'>Details about the job customer notification.</p>

              <Row className='mb-3 row-gap-3'>
                <Form.Group as={Col} md={6}>
                  <RequiredLabel label='To' id='to' />

                  <Controller
                    name='to'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Form.Control {...field} id='to' placeholder='Enter to' />

                        {formErrors && formErrors.to?.message && (
                          <Form.Text className='text-danger'>{formErrors.to?.message}</Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={6}>
                  <Form.Label htmlFor='yourRef'>Your Ref</Form.Label>

                  <Controller
                    name='yourRef'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Control {...field} id='yourRef' placeholder='Enter your ref' />
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={12}>
                  <Form.Label>Company</Form.Label>
                  <Form.Control required type='text' value={customerName || ''} disabled />
                </Form.Group>

                <Form.Group as={Col} md={6}>
                  <Form.Label htmlFor='attention'>Attention</Form.Label>

                  <Controller
                    name='attention'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Control {...field} id='attention' placeholder='Enter attention' />
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={6}>
                  <Form.Label htmlFor='faxNo'>Fax No</Form.Label>

                  <Controller
                    name='faxNo'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Control {...field} id='faxNo' placeholder='Enter fax no' />
                    )}
                  />
                </Form.Group>
              </Row>

              <hr className='my-4' />

              <Row className='mb-3 row-gap-3'>
                <Form.Group as={Col} md={6}>
                  <Form.Label>From</Form.Label>
                  <Form.Control required type='text' value='VITAR – SEGATEC SDN. BHD.' disabled />
                </Form.Group>

                <Form.Group as={Col} md={6}>
                  <Form.Label>Our Ref</Form.Label>
                  <Form.Control required type='text' value={cnId || ''} disabled />
                </Form.Group>

                <Form.Group as={Col} md={6}>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    required
                    type='text'
                    value={format(new Date(), 'dd MMMM yyyy')}
                    disabled
                  />
                </Form.Group>
              </Row>

              <hr className='my-4' />

              <div className='d-flex justify-content-center align-items-center mb-2'>
                <p className='text-muted fw-bold'>
                  MESSAGE: INFORMATION ON EQUIPMENT CONDITION / REQUIREMENT
                </p>
              </div>

              <Row className='mb-3 row-gap-3 align-items-center'>
                <Form.Group as={Col} md={3}>
                  <Controller
                    name='isBeforeCalibration'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Check
                        {...field}
                        checked={field.value}
                        id='isBeforeCalibration'
                        type='checkbox'
                        label='Before Calibration'
                      />
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Controller
                    name='isDuringCalibration'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Check
                        {...field}
                        checked={field.value}
                        id='isDuringCalibration'
                        type='checkbox'
                        label='During Calibration'
                      />
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Controller
                    name='isAfterCalibration'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Check
                        {...field}
                        checked={field.value}
                        id='isAfterCalibration'
                        type='checkbox'
                        label='After Calibration'
                      />
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={3}>
                  <Form.Label>CMR No</Form.Label>
                  <Form.Control required type='text' value={jobId?.id || ''} disabled />
                </Form.Group>
              </Row>

              <hr className='my-4' />
              <div className='d-flex align-items-center gap-1'>
                <h4 className='mb-0'>Calibrated Instruments</h4>{' '}
                <span className='text-danger' style={{ marginLeft: '4px' }}>
                  *
                </span>
              </div>
              <p className='text-muted fs-6 mb-0'>
                ist of instruments and their respective inspection results. Please select at least
                one instrument that is deemed faulty based on the calibration inspection.
              </p>

              {formErrors &&
                (formErrors.calibrationItems?.message ||
                  formErrors.calibrationItems?.root?.message) && (
                  <Form.Text className='d-inline-block text-danger mb-2'>
                    {formErrors.calibrationItems?.message ||
                      formErrors.calibrationItems?.root?.message}
                  </Form.Text>
                )}

              <Row>
                <Col className='mt-2'>
                  <DataTable
                    table={table}
                    isLoading={customerEquipments.isLoading || calibrations.isLoading}
                  >
                    <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
                      <DataTableSearch table={table} />

                      <div className='d-flex align-items-center gap-2'>
                        <DataTableFilter table={table} filterFields={filterFields} />
                        <DataTableViewOptions table={table} />
                      </div>
                    </div>
                  </DataTable>
                </Col>
              </Row>

              <hr className='my-4' />

              <Row className='mb-3 row-gap-3'>
                <Col className='px-0' xs={12}>
                  <p className='text-muted mb-1'>Please act soonest to:</p>
                </Col>

                <Form.Group as={Col} md={6}>
                  <Controller
                    name='isSendTheAccessories'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Check
                        {...field}
                        checked={field.value}
                        id='isSendTheAccessories'
                        type='checkbox'
                        label='Send the accessories as above mentioned as soon as possible.'
                      />
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={6}>
                  <Controller
                    name='isAcknowledgeConfirm'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Check
                        {...field}
                        checked={field.value}
                        id='isAcknowledgeConfirm'
                        type='checkbox'
                        label='Acknowledge / Confirm.'
                      />
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={6}>
                  <Controller
                    name='isArrangeForCollection'
                    control={form.control}
                    render={({ field }) => (
                      <Form.Check
                        {...field}
                        checked={field.value}
                        id='isArrangeForCollection'
                        type='checkbox'
                        label='Arrange for collection of this equipment.'
                      />
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={6}>
                  <Controller
                    name='isOthers'
                    control={form.control}
                    render={({ field: isOthersField }) => (
                      <div className='d-flex align-items-center gap-3'>
                        <Form.Check
                          {...isOthersField}
                          checked={isOthersField.value}
                          id='isOthers'
                          type='checkbox'
                          label='Others'
                        />

                        <Controller
                          name='others'
                          control={form.control}
                          render={({ field }) => (
                            <Form.Control {...field} disabled={!isOthersField.value} id='others' />
                          )}
                        />
                      </div>
                    )}
                  />
                </Form.Group>

                <Form.Group as={Col} md={6} className='text-center mx-auto mt-3'>
                  <RequiredLabel label='Technician' id='worker' />

                  <Controller
                    name='worker'
                    control={form.control}
                    render={({ field }) => (
                      <>
                        <Select
                          {...field}
                          inputId='worker'
                          instanceId='worker'
                          onChange={(option) => field.onChange(option)}
                          options={workerOptions}
                          isLoading={usersOptions.isLoading}
                          placeholder={
                            usersOptions.isLoading
                              ? 'Loading technician...'
                              : "Search by technician' name"
                          }
                          isDisabled={usersOptions.isLoading}
                          noOptionsMessage={() =>
                            usersOptions.isLoading ? 'Loading...' : 'No technician found'
                          }
                        />

                        {formErrors && formErrors.worker?.message && (
                          <Form.Text className='text-danger'>
                            {formErrors.worker?.message}
                          </Form.Text>
                        )}
                      </>
                    )}
                  />
                </Form.Group>

                <Col xs={12} className='d-flex justify-content-center mt-3'>
                  <Alert
                    className='mb-5 d-flex align-items-center gap-2'
                    style={{ width: 'fit-content' }}
                    variant='info'
                  >
                    <Lightbulb className='flex-shrink-0 me-1' size={20} />{' '}
                    <div>
                      Should you have any further queries on the above mentioned, please contact
                      <span className='fw-bold ps-1'>Mr. Avinaash Palanisamy.</span> Thank you.
                    </div>
                  </Alert>
                </Col>

                <hr className='my-4' />
              </Row>

              <Row className='mb-3 row-gap-3'>
                <Col md={6}>
                  <Row className='mb-3 row-gap-3 w-100'>
                    <Col className='px-0' xs={12}>
                      <h4 className='mb-0'>For Vitar-Segatec Lab Use Only</h4>
                      <p className='text-muted fs-6'>(After Customer Reply )</p>
                    </Col>

                    <Col className='px-0' xs={12}>
                      <p className='text-muted mb-1 text-center'>
                        Information provided above have been reviewed. Action to be taken:
                      </p>
                    </Col>

                    <Form.Group className='px-0' xs={12} as={Col}>
                      <Controller
                        name='forVitarLabUseIsProceed'
                        control={form.control}
                        render={({ field }) => (
                          <Form.Check
                            {...field}
                            checked={field.value}
                            id='forVitarLabUseIsProceed'
                            type='checkbox'
                            label='Proceed with calibration'
                          />
                        )}
                      />
                    </Form.Group>

                    <Form.Group className='px-0' xs={12} as={Col}>
                      <Controller
                        name='forVitarLabUseIsNoCalibrationRequired'
                        control={form.control}
                        render={({ field }) => (
                          <Form.Check
                            {...field}
                            checked={field.value}
                            id='forVitarLabUseIsNoCalibrationRequired'
                            type='checkbox'
                            label='No calibration required & return back to the customer.'
                          />
                        )}
                      />
                    </Form.Group>

                    <Form.Group className='px-0' xs={12} as={Col}>
                      <Controller
                        name='forVitarLabUseIsOthers'
                        control={form.control}
                        render={({ field: forVitarLabUseIsOthersField }) => (
                          <div className='d-flex align-items-center gap-3'>
                            <Form.Check
                              {...forVitarLabUseIsOthersField}
                              checked={forVitarLabUseIsOthersField.value}
                              id='forVitarLabUseIsOthers'
                              type='checkbox'
                              label='Others'
                            />

                            <Controller
                              name='forVitarLabUseOthers'
                              control={form.control}
                              render={({ field }) => (
                                <Form.Control
                                  {...field}
                                  disabled={!forVitarLabUseIsOthersField.value}
                                  id='forVitarLabUseOthers'
                                />
                              )}
                            />
                          </div>
                        )}
                      />
                    </Form.Group>

                    <Form.Group className='px-0' xs={12} as={Col}>
                      <RequiredLabel
                        label='Authorized by Head of Section'
                        id='forVitarLabUseAuthorizeBy'
                      />

                      <Controller
                        name='forVitarLabUseAuthorizeBy'
                        control={form.control}
                        render={({ field }) => (
                          <>
                            <Select
                              {...field}
                              inputId='forVitarLabUseAuthorizeBy'
                              instanceId='forVitarLabUseAuthorizeBy'
                              onChange={(option) => field.onChange(option)}
                              options={adminSupervisorOptions}
                              isLoading={usersOptions.isLoading}
                              placeholder={
                                usersOptions.isLoading ? 'Loading user...' : "Search by user' name"
                              }
                              isDisabled={usersOptions.isLoading}
                              noOptionsMessage={() =>
                                usersOptions.isLoading ? 'Loading...' : 'No user found'
                              }
                            />

                            {formErrors && formErrors.forVitarLabUseAuthorizeBy?.message && (
                              <Form.Text className='text-danger'>
                                {formErrors.forVitarLabUseAuthorizeBy?.message}
                              </Form.Text>
                            )}
                          </>
                        )}
                      />
                    </Form.Group>

                    <Form.Group className='px-0' xs={12} as={Col}>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        required
                        type='text'
                        value={format(new Date(), 'dd MMMM yyyy')}
                        disabled
                      />
                    </Form.Group>
                  </Row>
                </Col>

                <Col md={6}>
                  <Row className='mb-3 row-gap-3 w-100'>
                    <Col className='px-0' xs={12}>
                      <h4 className='mb-0'>Customer Reply Section</h4>
                      <p className='text-muted fs-6'>Customer authorization and remarks</p>
                    </Col>

                    <Col className='px-0' xs={12}>
                      <p className='text-muted mb-1 text-center'>
                        We acknowledge the information given / required:
                      </p>
                    </Col>

                    <Form.Group className='px-0' xs={12} as={Col}>
                      <Form.Label htmlFor='customerReplyRemarks'>Remarks</Form.Label>

                      <Controller
                        name='customerReplyRemarks'
                        control={form.control}
                        render={({ field }) => (
                          <Form.Control
                            {...field}
                            as='textarea'
                            row={2}
                            id='customerReplyRemarks'
                            placeholder='Enter remarks (if any)'
                          />
                        )}
                      />
                    </Form.Group>

                    <Form.Group
                      className='d-flex flex-column justify-content-center align-items-center'
                      as={Col}
                    >
                      <RequiredLabel label='Authorized By' id='customerReplyAuthorizeSignature' />

                      <Controller
                        name='customerReplyAuthorizeSignature'
                        control={form.control}
                        render={({ field }) => (
                          <>
                            <div className='d-flex justify-content-center flex-column align-items-center text-center'>
                              <SignatureField onChange={field.onChange} value={field.value} />
                              <div className='text-muted'>{to}</div>
                              <div className='text-muted'>{format(new Date(), 'dd MMMM yyyy')}</div>
                            </div>

                            {formErrors && formErrors.customerReplyAuthorizeSignature?.message && (
                              <Form.Text className='text-danger'>
                                {formErrors.customerReplyAuthorizeSignature?.message}
                              </Form.Text>
                            )}
                          </>
                        )}
                      />
                    </Form.Group>

                    <Col className='px-0' xs={12}>
                      <Alert
                        className='mb-5 d-flex align-items-center gap-2'
                        style={{ width: 'fit-content' }}
                        variant='info'
                      >
                        <Lightbulb className='flex-shrink-0 me-1' size={20} />{' '}
                        <div>
                          Please inform us if you have any objection and if we do not received any
                          reply within <span className='fw-bold'>3 working days</span>, we assumed
                          that you have agreed our explanation or action.
                        </div>
                      </Alert>
                    </Col>
                  </Row>
                </Col>
              </Row>

              <div className='mt-4 d-flex justify-content-between align-items-center'>
                <Button
                  disabled={isLoading}
                  type='button'
                  variant='outline-danger'
                  onClick={() => router.push('/job-cns')}
                >
                  Cancel
                </Button>

                <Button type='submit' disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner
                        as='span'
                        animation='border'
                        size='sm'
                        role='status'
                        aria-hidden='true'
                        className='me-2'
                      />
                      {data ? 'Updating' : 'Creating'}...
                    </>
                  ) : (
                    <>
                      <Save size={14} className='me-2' />
                      {data ? 'Update' : 'Create'} {' Job Customer Notification'}
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Form>
      </FormProvider>
    </>
  );
};

export default JobCnForm;
