import SearchCard from "@/components/search/SearchCard";

export default function Search() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="h-6" />
      <div className="px-6 pb-32">
        <SearchCard />
      </div>
    </div>
  );
}