import { MessageCircle } from "lucide-react";

function PageLoader() {
  return (
    <div className="page-loader" aria-label="Loading mingle">
      <div className="page-loader-mark"><MessageCircle size={24} /></div>
    </div>
  );
}

export default PageLoader
