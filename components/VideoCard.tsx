import Link from "next/link";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    video_url: string;
    thumbnail_url: string | null;
  };
  userInteraction: "like" | "dislike" | null;
}

export default function VideoCard({ video, userInteraction }: VideoCardProps) {
  const thumbnail =
    video.thumbnail_url ||
    `https://img.youtube.com/vi/${video.video_url}/mqdefault.jpg`;

  return (
    <Link href={`/player/${video.id}`}>
      <div className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer overflow-hidden">
        <figure className="relative">
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />
          {userInteraction && (
            <span
              className={`absolute top-2 right-2 badge badge-sm ${
                userInteraction === "like" ? "badge-success" : "badge-error"
              }`}
            >
              {userInteraction === "like" ? "👍" : "👎"}
            </span>
          )}
        </figure>
        <div className="card-body p-3">
          <h3 className="card-title text-sm">{video.title}</h3>
        </div>
      </div>
    </Link>
  );
}
