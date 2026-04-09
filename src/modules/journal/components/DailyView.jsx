import React, { useState } from "react";
import { format } from "date-fns";
import { Search, Menu, CloudUpload } from "lucide-react";

export default function DailyView({ date, onNavigateArchive, journal }) {
	const currentEntry = journal?.getEntry(date) || { title: "", content: "", type: "Todo", image: null };
	
	const [activeType, setActiveType] = useState(currentEntry.type);
	const [title, setTitle] = useState(currentEntry.title);
	const [content, setContent] = useState(currentEntry.content);
	const [image, setImage] = useState(currentEntry.image);

	// Update local state when date changes
	React.useEffect(() => {
		if (!journal) return;
		const newEntry = journal.getEntry(date) || { title: "", content: "", type: "Todo", image: null };
		setActiveType(newEntry.type);
		setTitle(newEntry.title);
		setContent(newEntry.content);
		setImage(newEntry.image);
	}, [date, journal]);

	// Auto-save when content changes
	React.useEffect(() => {
		const timer = setTimeout(() => {
			if (journal && (title || content || image || activeType !== "Todo")) {
				journal.saveEntry(date, { title, content, type: activeType, image });
			}
		}, 1000);
		return () => clearTimeout(timer);
	}, [title, content, activeType, image, date, journal]);

	const handleImageUpload = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => setImage(reader.result);
			reader.readAsDataURL(file);
		}
	};

	const types = [
		{ id: "Todo", bg: "bg-[#d3e4fe]", text: "text-[#506076]" },
		{ id: "List", bg: "bg-[#d8fbf2]", text: "text-[#46655e]" },
		{ id: "Paragraph", bg: "bg-[#f1f4f6]", text: "text-[#2b3437]" },
	];

	return (
		<div className="flex w-full h-full bg-[#f8f9fa] overflow-hidden font-['Inter']">
			
			{/* Left Sidebar (Desktop) */}
			<div className="w-[320px] h-full flex-shrink-0 flex-col border-r border-[#dfe1e6]/30 hidden lg:flex bg-[#f1f4f6]">
				
				{/* Top Branding / Action */}
				<div className="p-8">
					<div className="flex items-center gap-4 mb-16">
						<Menu className="w-5 h-5 text-[#2b3437] cursor-pointer hover:opacity-70 transition-opacity" onClick={onNavigateArchive} />
						<span className="text-[10px] tracking-[0.1em] uppercase font-bold text-[#2b3437]">The Archive <br/><span className="font-medium text-[#abb3b7]">Digital Curator</span></span>
					</div>
					
					{/* Calendar Widget Area */}
					<div className="flex flex-col gap-6">
						<div>
							<h3 className="text-2xl font-light font-['Manrope'] tracking-[-0.02em] text-[#2b3437]">{format(date, "MMMM")}</h3>
							<span className="text-[9px] uppercase tracking-[0.1em] text-[#abb3b7] font-semibold">Select a timestamp</span>
						</div>

						{/* Mini Calendar Grid */}
						<div className="grid grid-cols-7 gap-[2px] mt-4">
							{["M", "T", "W", "T", "F", "S", "S"].map(d => (
								<div key={d} className="text-[9px] font-semibold text-center text-[#abb3b7] pb-2">{d}</div>
							))}
							{/* Pad initial offset for demo purposes based on Sep */}
							<div/><div/><div/><div/>
							{Array.from({length: 30}).map((_, i) => {
								const d = i + 1;
								let bgClass = "bg-[#ffffff]";
								let textClass = "text-[#2b3437]";
								let borderClass = "";

								// Mock highlights
								if (d === 4) { bgClass = "bg-[#d8fbf2]"; textClass = "text-[#46655e]"; }
								if (d === 15) { bgClass = "bg-[#d3e4fe]"; textClass = "text-[#506076]"; }
								if (d === 9 || d === 23) { bgClass = "bg-[#fef3c7]"; textClass = "text-[#b45309]"; }
								if (d === 11) { bgClass = "bg-[#ffffff]"; borderClass = "border border-[#2b3437]"; } // Selected

								return (
									<button 
										key={d} 
										className={`aspect-square flex items-center justify-center text-xs font-medium hover:bg-[#dfe1e6]/40 transition-colors ${bgClass} ${textClass} ${borderClass}`}
										style={{ borderRadius: '2px' }}
									>
										{d}
									</button>
								);
							})}
						</div>
					</div>

					{/* Mini Legend */}
					<div className="mt-12 flex flex-col gap-3">
						<span className="text-[9px] tracking-[0.1em] uppercase text-[#abb3b7] font-semibold">Legend</span>
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-3 text-xs text-[#586062]">
								<div className="w-1.5 h-1.5 rounded-full bg-[#506076]" /> Task Entry
							</div>
							<div className="flex items-center gap-3 text-xs text-[#586062]">
								<div className="w-1.5 h-1.5 rounded-full bg-[#46655e]" /> Curated List
							</div>
							<div className="flex items-center gap-3 text-xs text-[#586062]">
								<div className="w-1.5 h-1.5 rounded-full bg-[#f0a500]" /> Journal Narrative
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Action */}
				<div className="mt-auto p-8 pb-10 flex flex-col gap-6">
					<button className="w-full py-4 bg-[#586062] hover:bg-[#464c4e] text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#586062]/20">
						Quick Log
					</button>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-[#abb3b7] overflow-hidden border border-[#dfe1e6]">
							{/* Placeholder Avatar */}
							<img src="https://i.pravatar.cc/100?img=33" alt="User" className="w-full h-full object-cover" />
						</div>
						<div className="flex flex-col">
							<span className="text-sm font-semibold text-[#2b3437]">Alex Rivera</span>
							<span className="text-[10px] uppercase text-[#abb3b7] font-medium tracking-[0.05em]">Free Plan</span>
						</div>
					</div>
				</div>

			</div>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-y-auto">
				
				{/* Top Bar */}
				<div className="flex items-center justify-between px-10 py-6 border-b border-[#dfe1e6]/0">
					<span className="text-[10px] tracking-[0.1em] uppercase text-[#abb3b7] font-semibold">Section / Daily Journal</span>
					<div className="flex items-center gap-6 text-[#abb3b7]">
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#f1f4f6] cursor-text transition-colors">
							<Search size={14} />
							<span className="text-xs font-medium">Search Archives...</span>
						</div>
						<button className="hover:text-[#2b3437] transition-colors"><Menu size={18} /></button>
					</div>
				</div>

				{/* Editor Container */}
				<div className="max-w-[800px] w-full mx-auto px-10 pt-16 pb-32 flex flex-col">
					
					{/* Date Header */}
					<div className="flex flex-col gap-2 mb-12">
						<span className="text-[10px] tracking-[0.1em] uppercase text-[#abb3b7] font-semibold">{format(date, "EEEE")}</span>
						<div className="flex items-baseline gap-4">
							<h1 className="text-[4rem] leading-[1.1] font-light font-['Manrope'] tracking-[-0.03em] text-[#2b3437]">
								{format(date, "MMMM d")}
							</h1>
						</div>
					</div>

					{/* Action Chips */}
					<div className="flex items-center justify-between mb-16">
						<div className="flex items-center gap-3">
							{types.map(type => (
								<button
									key={type.id}
									onClick={() => setActiveType(type.id)}
									className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
										activeType === type.id 
											? `${type.bg} ${type.text} shadow-sm` 
											: `bg-[#ffffff] text-[#abb3b7] hover:bg-[#f1f4f6]`
									}`}
								>
									{type.id}
								</button>
							))}
						</div>
						
						<div className="flex items-center gap-2 text-[10px] font-semibold text-[#abb3b7] uppercase tracking-[0.05em]">
							<CloudUpload size={14} className="text-[#506076]" />
							Autosaved
						</div>
					</div>

					{/* Title Input */}
					<div className="mb-10 relative">
						<input 
							type="text" 
							placeholder="Title of your entry..." 
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full bg-transparent text-3xl font-light font-['Manrope'] text-[#2b3437] placeholder-[#abb3b7]/60 outline-none border-b border-[#abb3b7]/20 focus:border-[#586062] transition-colors pb-4"
						/>
					</div>

					{/* Content Input Area */}
					<div className="relative min-h-[400px]">
						<textarea 
							placeholder="Start writing. Capture the silence of the morning, the weight of the tasks, or the lists that keep the world turning..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="w-full h-full min-h-[400px] bg-transparent text-lg text-[#2b3437] leading-relaxed placeholder-[#abb3b7]/40 outline-none resize-none"
						/>
						
						{/* Floating image placeholder area on the right (as per design) */}
						<div className="absolute top-0 -right-48 w-40 opacity-0 lg:opacity-100 transition-opacity">
							<div className="bg-[#f1f4f6] rounded-sm overflow-hidden border border-[#dfe1e6]/50 shadow-sm group cursor-pointer transition-transform hover:-translate-y-1 relative">
								<input 
									type="file" 
									accept="image/*"
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
									onChange={handleImageUpload}
								/>
								<div className="aspect-[4/3] bg-[#e2e8f0] relative">
									{image ? (
										<img src={image} alt="Inspiration" className="w-full h-full object-cover" />
									) : (
										<div className="absolute inset-0 flex flex-col items-center justify-center text-[#abb3b7] group-hover:text-[#586062] transition-colors">
											<span className="text-xs font-medium">+ Add Visual</span>
										</div>
									)}
								</div>
								<div className="p-2 bg-white flex justify-between items-center">
									<span className="text-[9px] uppercase tracking-widest text-[#abb3b7] font-semibold">Inspiration</span>
									{image && (
										<button 
											onClick={(e) => { e.preventDefault(); setImage(null); }} 
											className="text-[9px] text-red-400 hover:text-red-600 relative z-20"
										>
											Clear
										</button>
									)}
								</div>
							</div>
						</div>
					</div>

				</div>
			</div>
		</div>
	);
}
