
const OnboardingHeader = () => {
    return (
        <header className="bg-white/80 border-b border-gray-100/80 py-3 px-6 sticky top-0 z-50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-tr from-primary to-blue-600 rounded-lg p-2 shadow-md shadow-primary/10">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="font-bold text-lg text-gray-900 tracking-tight">wService</span>
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded">Partner Portal</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500">
                        Need help? <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline">Contact Support</a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default OnboardingHeader;
