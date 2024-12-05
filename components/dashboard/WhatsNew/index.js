import React from 'react';
import { Modal } from 'react-bootstrap';
import styles from './WhatsNew.module.css';

const WhatsNew = ({ show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Body className={styles.modalBody}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.title}>
              <span role="img" aria-label="celebration">🎉</span>
              What's New
            </div>
            <button className={styles.closeButton} onClick={onHide}>×</button>
          </div>
          <div className={styles.subtitle}>Version History & Updates</div>
        </div>

        <div className={styles.content}>
          <div className={styles.version}>
            <div className={styles.versionHeader}>
              <div className={styles.versionInfo}>
                <span className={styles.versionNumber}>Version 2.1.1</span>
                <span className={styles.versionDate}>December 4, 2024</span>
                <span className={styles.badge}>patch</span>
              </div>
            </div>

            <div className={styles.features}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📋</div>
                <div className={styles.featureContent}>
                  <h4>Enhanced Certificate Preview</h4>
                  <p>Improved certificate preview with real-time data and customizable templates.</p>
                  <div className={styles.tag}>improved</div>
                </div>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔄</div>
                <div className={styles.featureContent}>
                  <h4>Calibration Categories</h4>
                  <p>Reorganized component structure for better maintainability and performance.</p>
                  <div className={styles.tag}>improved</div>
                </div>
              </div>

              <div className={`${styles.featureCard} ${styles.highlight}`}>
                <div className={styles.featureIcon}>✨</div>
                <div className={styles.featureContent}>
                  <h4>What's New Interface</h4>
                  <p>New version history tracking with animated UI and better organization.</p>
                  <div className={styles.tag}>new</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default WhatsNew; 