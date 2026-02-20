"use client";

import { useQueryState } from "nuqs";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Room {
    id: string;
    name: string;
}

interface Template {
    id: string;
    name: string;
}

interface ReportListFiltersProps {
    rooms: Room[];
    templates: Template[];
}

export function ReportListFilters({ rooms, templates }: ReportListFiltersProps) {
    const [currentRoom, setCurrentRoom] = useQueryState("room", { defaultValue: "all", shallow: false });
    const [currentTemplate, setCurrentTemplate] = useQueryState("template", { defaultValue: "all", shallow: false });

    const uniqueTemplates = useMemo(() => {
        const map = new Map<string, Template>();
        templates.forEach(t => {
            if (!map.has(t.name)) {
                map.set(t.name, t);
            }
        });
        return Array.from(map.values() as IterableIterator<Template>);
    }, [templates]);

    const hasFilters = currentRoom !== "all" || currentTemplate !== "all";

    const clearFilters = () => {
        setCurrentRoom("all");
        setCurrentTemplate("all");
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="w-full sm:w-64">
                <Select
                    value={currentTemplate}
                    onValueChange={(val) => setCurrentTemplate(val)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua Template" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Template</SelectItem>
                        {uniqueTemplates.map((template) => (
                            <SelectItem key={template.name} value={template.name}>
                                {template.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full sm:w-64">
                <Select
                    value={currentRoom}
                    onValueChange={(val) => setCurrentRoom(val)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua Ruangan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Ruangan</SelectItem>
                        {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                                {room.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {hasFilters && (
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="flex-shrink-0"
                >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                </Button>
            )}
        </div>
    );
}
