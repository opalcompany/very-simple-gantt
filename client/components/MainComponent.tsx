import { add, addDays, format as ff, formatDuration, formatISO, intervalToDuration, parseISO, roundToNearestMinutes, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import React, { Fragment, useState } from 'react';
import { ButtonGroup, Col, Container, Row } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { Cicciolo } from './Cicciolo';

export const MainComponent: React.FC = () => {
    return (
        <Container>
            <Cicciolo />
        </Container>
    );
}
