"use client";
import { Inbox, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface File {
    file_key: string;
    file_name: string;
}

const FileUpload = () => {
    const router = useRouter();
    const [Loading, setLoading] = useState<boolean>(false);
    // mutation is a function that allows us to hit backend api
    const { mutate, isPending } = useMutation({
        mutationFn: async ({ file_key, file_name }: File) => {
            const response = await axios.post("/api/create-chat", {
                file_key,
                file_name,
            });
            return response.data;
        },
    });

    const { getRootProps, getInputProps } = useDropzone({
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file.size > 1 * 1024 * 1024) {
                // bigger than 10MB
                toast.error("File size should be less than 1MB");
                return;
            }
            try {
                setLoading(true);
                const data = await uploadToS3(file);
                // hit the backend api after uploading the data to s3
                if (!data?.file_key || !data?.file_name) {
                    toast.error("Error uploading file to S3");
                    return;
                }
                mutate(data, {
                    onSuccess: ({ chat_id }) => {
                        toast.success("Chat created successfully");
                        router.push(`/chat/${chat_id}`);
                    },
                    onError: (error) => {
                        toast.error("error creating chat");
                        console.log(error);
                    },
                });
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        },
    });
    return (
        <div className="p-2 bg-white rounded-xl">
            <div
                {...getRootProps({
                    className:
                        "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
                })}
            >
                <input {...getInputProps()} />
                {Loading || isPending ? (
                    <>
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        <p className="mt-2 text-sm text-slate-400 ">Spilling Tea to GPT...</p>
                    </>
                ) : (
                    <>
                        <Inbox className="w-10 h-10 text-blue-500 " />
                        <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
