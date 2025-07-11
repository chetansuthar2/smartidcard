import React from "react";

interface Student {
  image_url: string;
  name: string;
  application_number: string;
  class: string;
  department: string;
  phone: string;
  email: string;
}

interface StudentCardProps {
  student: Student;
}

export default function StudentCard({ student }: StudentCardProps) {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="flex flex-col items-center p-6">
        <img
          src={student.image_url}
          alt={student.name}
          className="w-28 h-28 rounded-full border-4 border-blue-400 shadow mb-4 object-cover"
        />
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{student.name}</h2>
        <p className="text-blue-600 font-semibold mb-2">
          Application No: {student.application_number}
        </p>
        <div className="w-full border-t border-gray-200 my-2"></div>
        <div className="text-gray-600 text-sm mb-1">
          <span className="font-semibold">Class:</span> {student.class}
        </div>
        <div className="text-gray-600 text-sm mb-1">
          <span className="font-semibold">Department:</span> {student.department}
        </div>
        <div className="text-gray-600 text-sm mb-1">
          <span className="font-semibold">Phone:</span> {student.phone}
        </div>
        <div className="text-gray-600 text-sm">
          <span className="font-semibold">Email:</span> {student.email}
        </div>
      </div>
    </div>
  );
}