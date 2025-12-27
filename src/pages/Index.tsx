import { PhoneMockup } from '@/components/PhoneMockup';
import { MobileAppContent } from '@/components/MobileAppContent';

export default function Index() {
  return (
    <div className="min-h-screen bg-[hsl(var(--page-bg))] flex items-center justify-center">
      <PhoneMockup>
        <MobileAppContent />
      </PhoneMockup>
    </div>
  );
}
