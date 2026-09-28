import React from "react";
import { FaPlus } from "react-icons/fa6";
import { motion } from "framer-motion";

const CreateTeamCard = ({ onClick }) => {
  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      <motion.div
        className="w-40 h-[160px] border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center cursor-pointer bg-gradient-to-br from-blue-50/50 via-blue-50/30 to-white hover:from-blue-100/70 hover:via-blue-100/50 hover:to-blue-50 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-lg group"
        onClick={onClick}
        whileHover={{
          scale: window.innerWidth >= 768 ? 1.05 : 1.02,
          y: -5,
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300">
          <FaPlus className="text-2xl sm:text-3xl text-white" />
        </div>
      </motion.div>

      <div className="flex flex-col items-center justify-center gap-1 min-h-[60px]">
        <span className="text-[14px] font-[500] text-[#546078] text-center mt-2">
          Add New Team
        </span>
        <span className="text-gray-400 text-[15px] font-medium text-center invisible">
          Placeholder
        </span>
        <span className="text-gray-400 text-[12px] text-center invisible">
          Placeholder
        </span>
      </div>
    </div>
  );
};

export default CreateTeamCard;
