import React, { useState } from 'react';
import CourseApplicationModal from '../forms/CourseApplicationModal';
import { submitCourseApplication } from '../../services/api';

const CourseList = ({ courses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleApply = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleSubmitApplication = async (formData) => {
    try {
      await submitCourseApplication(formData);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return (
    <div className="course-list">
      {courses.map((course) => (
        <div key={course.id} className="course-card">
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <button 
            onClick={() => handleApply(course)}
            className="apply-button"
          >
            Apply Now
          </button>
        </div>
      ))}

      <CourseApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseData={selectedCourse}
        onSubmit={handleSubmitApplication}
      />
    </div>
  );
};

export default CourseList;