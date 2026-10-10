import React, { useState, useEffect } from 'react';
import { balerServiceApi } from '../../lib/api/balerService';
import { BalerJobOpportunity } from '../../types/baler';
import { PageHeroBanner } from '../../components/layout/PageHeroBanner';
import { useToast } from '../../lib/context/ToastContext';
import { MapPin, Calendar, Check, ArrowRight, Truck } from 'lucide-react';

interface BalerJobsPageProps {
  onNavigate: (path: string) => void;
}

export const BalerJobsPage: React.FC<BalerJobsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<BalerJobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await balerServiceApi.getBalerJobs();
        setJobs(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAcceptJob = async (jobId: string) => {
    try {
      const updated = await balerServiceApi.updateJobStatus(jobId, 'Accepted');
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      showToast('Baling Job Accepted', `Scheduled machinery dispatch to ${updated.farmerName}'s field`);
    } catch {
      showToast('Error', 'Unable to accept job', 'error');
    }
  };

  const totalEarnings = jobs.reduce((acc, j) => acc + j.totalJobEarningsEstInr, 0);

  return (
    <div className="w-full">
      {/* Immersive Baler Jobs Hero Section */}
      <PageHeroBanner
        badge="03 / Custom Hiring Baling Jobs"
        badgeIcon={<Truck className="w-3.5 h-3.5 text-[#E5A812]" />}
        title="Field Baling Matching Opportunities"
        subtitle="Direct crop residue baling requests matched by GPS proximity to your custom hiring machinery fleet within a 55km service corridor."
        bgImageUrl="https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2600&auto=format&fit=crop"
        stats={[
          { label: 'Matched Opportunities', value: jobs.length, highlight: true },
          { label: 'Open for Dispatch', value: jobs.filter((j) => j.status === 'Open').length },
          { label: 'Potential Fee Value', value: totalEarnings, prefix: '₹', highlight: true },
          { label: 'Service Coverage', value: '55 km Radius' },
        ]}
        actions={
          <>
            <button
              onClick={() => onNavigate('/baler/profile')}
              className="bg-[#2E581F] hover:bg-[#244818] text-white px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xl cursor-pointer border border-white/10"
            >
              <span>Manage Machinery Fleet</span>
              <span className="w-5 h-5 rounded-full bg-[#E5A812] text-[#0D1810] flex items-center justify-center font-bold text-xs">
                →
              </span>
            </button>
            <button
              onClick={() => onNavigate('/fire-risks')}
              className="border border-[#E5A812] hover:bg-[#E5A812]/15 text-[#E5A812] px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer bg-black/30 backdrop-blur-xs"
            >
              <span>View High-Risk Corridors</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#5E6D63]">Loading matched baling jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-16 bg-white/85 backdrop-blur-md border border-white/70 rounded-3xl text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
            <p className="text-base font-bold text-[#19241B]">No open jobs in your service radius</p>
            <p className="text-xs text-[#5E6D63] mt-1">
              Check your service radius setting in 'My Services' to expand search radius.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.09)] hover:border-[#245E3F]/40 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded ${
                        job.status === 'Accepted' ? 'bg-[#EAF2ED] text-[#1E4530]' : 'bg-[#FEF4E8] text-[#8C4600]'
                      }`}>
                        {job.status} Job
                      </span>
                      <h3 className="text-base font-bold text-[#19241B]">
                        {job.farmerName} — {job.village}, {job.district}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#5E6D63]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8A795D]" />
                        <span>{job.distanceFromBaseKm} km from machinery hub</span>
                      </div>
                      <span aria-hidden="true">·</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8A795D]" />
                        <span>Target Start Date: {job.preferredStartDate}</span>
                      </div>
                      <span aria-hidden="true">·</span>
                      <span>Crop: <strong>{job.cropType}</strong></span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-white/60 text-xs shadow-xs">
                      <div>
                        <p className="text-[#5E6D63]">Field Area</p>
                        <p className="font-mono font-bold text-[#19241B]">{job.fieldAreaAcres} Acres</p>
                      </div>
                      <div>
                        <p className="text-[#5E6D63]">Est. Residue</p>
                        <p className="font-mono font-bold text-[#19241B]">{job.estimatedTonnage} Tons</p>
                      </div>
                      <div>
                        <p className="text-[#5E6D63]">Offered Baling Rate</p>
                        <p className="font-mono font-bold text-[#1B382B]">₹{job.offeredRatePerAcreInr}/acre</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:text-right flex flex-col justify-between shrink-0 space-y-3">
                    <div>
                      <p className="text-xs text-[#5E6D63]">Estimated Baling Earnings</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-[#1B382B]">
                        ₹{job.totalJobEarningsEstInr.toLocaleString()}
                      </p>
                    </div>

                    {job.status === 'Open' ? (
                      <button
                        onClick={() => handleAcceptJob(job.id)}
                        className="px-5 py-2.5 bg-[#1B382B] text-white rounded-xl text-xs font-bold hover:bg-[#12261D] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Dispatch Unit</span>
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-[#EAF2ED] text-[#1E4530] text-xs font-semibold rounded-lg text-center">
                        ✓ Unit Dispatched / Scheduled
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
