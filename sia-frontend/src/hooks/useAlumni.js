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
      const allYearsRes = await pb.collection('alumni').getFullList({ 
        fields: 'tahun_lulus',
        requestKey: 'batch-stats'
      });
      
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      
      const currentCount = allYearsRes.filter(a => Number(a.tahun_lulus) === currentYear).length;
      const lastCount = allYearsRes.filter(a => Number(a.tahun_lulus) === lastYear).length;
      
      return { currentCount, lastCount, total: allYearsRes.length };
    },
    staleTime: 1000 * 60 * 10, // Stats can be stale for 10 minutes
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
