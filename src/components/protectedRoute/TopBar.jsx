const TopBar = () => {
  return (
    <div className="bg-surface border-b border-gray-200">
      <div className="container mx-auto py-3 px-4 sm:px-6 lg:px-8 max-w-[1500px]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
          <p className="hidden md:block text-xs text-secondary font-medium leading-[20px] -tracking-[0.3%] text-center md:text-left">
            Upload your CV once & apply to jobs in one click — Start now!
          </p>
          <div className="w-full md:w-auto flex items-center justify-between md:justify-start md:space-x-6">
            <div className="flex items-center space-x-[5px] text-sm text-gray-700">
              <img src="/Phone.svg" alt="Phone" className="w-5 h-5" />
              <span className="font-medium">+1-202-555-0178</span>
            </div>
            <button className="flex items-center space-x-1 text-sm text-gray-700 hover:text-primary transition">
              <img
                src="/us_flag.svg"
                alt="United States"
                title="United States"
                className="w-5 h-3.5"
              />
              <span className="font-medium">English</span>
              <img
                src="/fi_chevron-down.svg"
                alt="Chevron Down"
                className="w-4 h-4"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
