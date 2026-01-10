"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type Props = {
  images: Array<{ src: string; alt: string }>;
  className?: string;
};

export function ImageLightbox({ images, className }: Props) {
  const primary = images[0];
  if (!primary) {
    return <div className={className} />;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="block w-full text-left">
          <img
            src={primary.src}
            alt={primary.alt}
            className={className}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl w-[95vw] p-0 shadow-2xl">
        <div className="border-b p-4 sm:p-6">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((image) => (
                <CarouselItem key={image.src}>
                  <div className="p-1">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="max-h-[80vh] w-full rounded-lg bg-black/5 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 ? (
              <>
                <CarouselPrevious className="left-3 bg-background/80 backdrop-blur" />
                <CarouselNext className="right-3 bg-background/80 backdrop-blur" />
              </>
            ) : null}
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}
