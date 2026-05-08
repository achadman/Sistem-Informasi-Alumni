import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { pb } from '../lib/pb';

export const useAlumni = (page = 1, perPage = 20, filter = '', sort = '') => {
  return useQuery({
    queryKey: ['alumni', { page, perPage, filter, sort }],
    queryFn: async () => {
      const options = {};
      if (sort) options.sort = sort;
      if (filter) options.filter = filter;
      return await pb.collection('alumni').getList(page, perPage, options);
    },
    placeholderData: keepPreviousData,
  });
};

export const useAlumniStats = () => {
  return useQuery({
    queryKey: ['alumni-stats'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;

      // OPTIMIZATION: Get only the counts from server instead of downloading thousands of records
      const [currentRes, lastRes, totalRes] = await Promise.all([
        pb.collection('alumni').getList(1, 1, { filter: `tahun_lulus = ${currentYear}`, requestKey: 'stat-current' }),
        pb.collection('alumni').getList(1, 1, { filter: `tahun_lulus = ${lastYear}`, requestKey: 'stat-last' }),
        pb.collection('alumni').getList(1, 1, { requestKey: 'stat-total' })
      ]);
      
      return { 
        currentCount: currentRes.totalItems, 
        lastCount: lastRes.totalItems, 
        total: totalRes.totalItems 
      };
    },
    staleTime: 1000 * 60 * 30, // Stats stay valid for 30 minutes
  });
};

export const useAlumniDetail = (id) => {
  return useQuery({
    queryKey: ['alumni', id],
    queryFn: async () => {
      return await pb.collection('alumni').getOne(id);
    },
    enabled: !!id,
  });
};
