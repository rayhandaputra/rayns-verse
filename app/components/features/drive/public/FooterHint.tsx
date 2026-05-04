import moment from "moment";

export const FooterHint = () => (
  <div id="drive-footer-hint" className="p-3 border-t border-gray-50 text-[10px] text-gray-300 text-center">
    &copy; {moment().year()} Kinau.id · All rights reserved
  </div>
);
