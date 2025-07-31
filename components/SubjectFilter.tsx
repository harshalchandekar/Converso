'use client'

import { subjects } from "@/constants";
import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SubjectFilter = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get("subject") || "";

    const [subject, setSubject] = useState(query);

    useEffect(() => {
            let newUrl = "";
            if(subject === "all"){
                newUrl = removeKeysFromUrlQuery({
                 params: searchParams.toString(),
                 keysToRemove: ["subject"],
                });
            } else {
                newUrl = formUrlQuery({
                    params: searchParams.toString(),
                     key: "subject",
                     value: subject,
                });
            }
            router.push(newUrl, {scroll: false});
    },[subject])

    return(
            <Select onValueChange={setSubject} value={subject}>
                <SelectTrigger className="input capitalize">
                    <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject} className="capitalize">
                            {subject}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
    )
}

export default SubjectFilter;